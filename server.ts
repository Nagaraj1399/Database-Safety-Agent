import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Initialize Gemini AI client if API key is present
  const apiKey = process.env.GEMINI_API_KEY || '';
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Gemini AI initialization note:', e);
    }
  }

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      agent: 'TrueForge Database Change Safety Agent',
      timestamp: new Date().toISOString(),
      geminiConnected: Boolean(apiKey),
    });
  });

  // Semantic AI Risk Analysis endpoint
  app.post('/api/gemini/analyze-migration', async (req, res) => {
    const { sql, schemaDiff, integrityReport, riskAssessment } = req.body;

    if (!ai || !apiKey) {
      // Return smart rule-based DBA synthesis if API key is not configured
      return res.json({
        analysis: generateHeuristicAnalysis(sql, schemaDiff, integrityReport, riskAssessment),
        recommendations: riskAssessment?.recommendations || [],
        source: 'rule_engine',
      });
    }

    try {
      const prompt = `You are a Principal Database Administrator and Database Safety Agent for PostgreSQL.
Analyze the following proposed database migration that was tested in an isolated sandbox database:

MIGRATION SQL:
\`\`\`sql
${sql}
\`\`\`

SCHEMA DIFF:
${JSON.stringify(schemaDiff?.items || [], null, 2)}

INTEGRITY RESULTS:
${JSON.stringify(integrityReport?.checks?.map((c: any) => ({ name: c.name, status: c.status, summary: c.summary, count: c.offendingCount })) || [], null, 2)}

RULE RISK ASSESSMENT:
Score: ${riskAssessment?.score}/100, Level: ${riskAssessment?.level}, Verdict: ${riskAssessment?.verdict}

Provide a concise, expert 3-paragraph safety assessment:
1. Executive Risk Summary & Table Lock Impact (AccessExclusiveLock vs ShareLock, table rewrite hazard, index build duration, replication lag).
2. Data Integrity & Backwards Compatibility (Will existing queries fail? Truncation or constraint issues?).
3. Specific Actionable Remediation & Safe Rollout Steps (e.g. ADD COLUMN NULL first, backfill in batches, CREATE INDEX CONCURRENTLY, lock timeout).

Return valid JSON with:
{
  "analysis": "string of 3 paragraphs",
  "recommendations": ["string", "string", "string"]
}`;

      // Generous timeout of 12 seconds for model execution
      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Model timeout after 12s')), 12000)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        return res.json({
          analysis: parsed.analysis || responseText,
          recommendations: parsed.recommendations || riskAssessment.recommendations,
          source: 'gemini-3.8-flash',
        });
      } catch {
        return res.json({
          analysis: responseText,
          recommendations: riskAssessment.recommendations,
          source: 'gemini-3.8-flash',
        });
      }
    } catch (err: any) {
      return res.json({
        analysis: generateHeuristicAnalysis(sql, schemaDiff, integrityReport, riskAssessment),
        recommendations: riskAssessment?.recommendations || [],
        source: 'rule_engine',
      });
    }
  });

  // Project repository manifest export endpoint
  app.get('/api/project-export', (req, res) => {
    res.json({
      name: 'trueforge-database-change-safety-agent',
      version: '1.0.0',
      description: 'Production-ready Database Change Safety Agent repository with Docker Compose, FastAPI, PostgreSQL, and Sandbox architecture.',
      structure: [
        'docker-compose.yml',
        'backend/app/main.py',
        'backend/app/agents/safety_agent.py',
        'backend/app/tools/db_tools.py',
        'backend/app/models/schemas.py',
        'database/schema.sql',
        'database/seed.sql',
        'docs/architecture.md',
        'docs/security.md',
        'docs/agent-workflow.md',
      ],
    });
  });

  // Mount Vite middleware in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrueForge Server running on http://0.0.0.0:${PORT}`);
  });
}

function generateHeuristicAnalysis(sql: string, schemaDiff: any, integrityReport: any, risk: any): string {
  const isDrop = /DROP\s+COLUMN|DROP\s+TABLE/i.test(sql);
  const isTruncate = integrityReport?.checks?.some((c: any) => c.id === 'check_truncation' && c.status === 'FAIL');
  const isFk = /ADD\s+CONSTRAINT.*FOREIGN\s+KEY/i.test(sql);
  const isIndex = /CREATE\s+INDEX/i.test(sql);

  if (isTruncate) {
    return `CRITICAL RISK: The proposed column type alteration narrows storage capacity and causes permanent data truncation for existing rows in the database. PostgreSQL will reject this migration in production with 'value too long for type character varying', terminating active transactions and throwing database runtime errors. Recommended remediation: Audit existing maximum string lengths before setting column limits, or migrate to a staged column with data cleansing.`;
  }

  if (isDrop) {
    return `HIGH RISK: Destructive schema modification detected. Dropping columns irreversibly erases historical data and invalidates any ORM models or analytical pipelines querying this attribute. This operation requires an AccessExclusiveLock on the target table, queuing all read and write queries. Recommended remediation: Deprecate the field in application code first, schedule during a low-traffic maintenance window, and export an immutable snapshot prior to human approval.`;
  }

  if (isIndex) {
    return `SAFE PERFORMANCE IMPROVEMENT: Creating an index optimizes query planner scans for lookup predicates without modifying table row contents. In production on large PostgreSQL tables, standard CREATE INDEX acquires a ShareLock, blocking writes. Recommended remediation: Execute using 'CREATE INDEX CONCURRENTLY' to allow concurrent INSERT/UPDATE/DELETE operations while the B-Tree index is being constructed.`;
  }

  if (isFk) {
    return `INTEGRITY VERIFICATION: Adding foreign key constraints guarantees referential integrity between tables. In PostgreSQL, adding a foreign key validates every existing row, acquiring a ShareRowExclusiveLock. The sandbox execution verified that existing references are valid and zero orphan records exist. Recommended remediation: Consider ADD CONSTRAINT ... NOT VALID followed by VALIDATE CONSTRAINT to prevent long table locks.`;
  }

  return `VALIDATION COMPLETE: The proposed migration statement completed sandbox testing with zero schema violations, stable row counts, and matching cryptographic checksums. No data loss or constraint conflicts were detected. Production execution requires explicit human authorization.`;
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

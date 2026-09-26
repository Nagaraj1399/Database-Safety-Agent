import { MigrationReport } from '../types/database';

export function generateMarkdownReport(report: MigrationReport): string {
  const dateStr = new Date(report.createdAt).toISOString();
  
  return `# 🛡️ TrueForge Migration Safety Audit Report

**Report ID:** \`${report.migrationId}\`  
**Generated:** ${dateStr}  
**Environment Target:** \`${report.environmentTarget}\`  
**Approval State:** **${report.approvalState}**  
**Risk Level:** **${report.riskAssessment.level}** (Score: ${report.riskAssessment.score}/100)  
**Operator:** ${report.operator}  

---

## 1. Executive Summary

- **Verdict:** \`${report.riskAssessment.verdict}\`
- **Assessment Title:** ${report.riskAssessment.title}
- **Summary:** ${report.riskAssessment.summary}
- **Lock Hazard:** \`${report.riskAssessment.downtimeRisk}\`
- **Rollback Feasibility:** \`${report.riskAssessment.rollbackFeasibility}\`

${report.riskAssessment.aiAnalysis ? `### AI Agent Risk Analysis & Lock Impact:\n${report.riskAssessment.aiAnalysis}\n` : ''}

---

## 2. Proposed Migration SQL

\`\`\`sql
${report.migrationSql}
\`\`\`

## 3. Inverse Rollback SQL

\`\`\`sql
${report.rollbackSql}
\`\`\`

---

## 4. Schema Mutations & AST Diff

${report.schemaDiff.items.length === 0 ? '_No structural schema changes detected._' : report.schemaDiff.items.map(item => `- **${item.type}**: \`${item.tableName}\` ${item.columnName ? `column \`${item.columnName}\`` : ''} - ${item.description} ${item.isDestructive ? '⚠️ **[DESTRUCTIVE]**' : ''}`).join('\n')}

---

## 5. Row-Level Data Impact & Checksums

| Table | Pre-Migration Rows | Post-Migration Rows | Delta | Checksum Status | Verification Status |
| :--- | :---: | :---: | :---: | :--- | :---: |
${Object.values(report.rowDiffs).map(diff => `| **${diff.tableName}** | ${diff.beforeRowCount} | ${diff.afterRowCount} | ${diff.rowsAdded > 0 ? `+${diff.rowsAdded}` : diff.rowsRemoved > 0 ? `-${diff.rowsRemoved}` : '0'} | \`${diff.checksumBefore}\` → \`${diff.checksumAfter}\` | **${diff.status}** |`).join('\n')}

---

## 6. 6-Point Automated Integrity Suite

${report.integrityReport.checks.map(check => `### [${check.status}] ${check.name}
- **Category:** \`${check.category}\`
- **Result:** ${check.summary}
${check.recommendation ? `- **Remediation:** ${check.recommendation}` : ''}
${check.offendingExamples && check.offendingExamples.length > 0 ? `- **Offending Records Detected:** ${check.offendingCount}` : ''}
`).join('\n')}

---

## 7. Production Authorization Gate

- **Invariant:** Direct writes to production are blocked.
- **Status:** ${report.approvalState === 'APPROVED' ? `✅ **APPROVED & EXECUTED** by \`${report.approvalRecord?.approvedBy || 'Operator'}\` at ${report.approvalRecord?.approvedAt || report.executedAt}` : '🔒 **AWAITING EXPLICIT HUMAN OPERATOR APPROVAL**'}
${report.approvalRecord?.auditSignature ? `- **Cryptographic Audit Signature:** \`${report.approvalRecord.auditSignature}\`` : ''}

---
*Report generated autonomously by TrueForge Database Change Safety Agent.*
`;
}

export function downloadReportAsFile(report: MigrationReport) {
  const content = generateMarkdownReport(report);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TrueForge-Audit-${report.migrationId}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { FinanceClient } from './finance-client';

export const dynamic = 'force-dynamic';

export default function FinancasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finanças</h1>
        <p className="text-sm text-muted-foreground">Assinaturas, gastos, metas e alertas</p>
      </div>
      <FinanceClient />
    </div>
  );
}

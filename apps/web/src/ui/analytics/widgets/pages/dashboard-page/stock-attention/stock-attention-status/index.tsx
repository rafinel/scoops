export const StockAttentionStatus = ({ loading = false }: { loading?: boolean }) =>
  loading ? <p role='status'>Carregando estoque…</p> : null

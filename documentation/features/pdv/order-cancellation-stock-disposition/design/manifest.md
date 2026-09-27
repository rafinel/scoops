# Referências de cancelamento com destino do estoque

| Referência | Pencil arquivo/nó | Estado | Viewport | Screenshot | Superfície | Tokens/componentes | Validação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Confirmação | `design/onoreo.pen` / `c52HsC` | Três linhas, devolução padrão e perda selecionada | 657 × 894 | [c52HsC.png](./c52HsC.png) | `CancelOrderDialog` | Manrope; `primary`, `success`, `danger`, `border`; diálogo e seleção | AC-02, AC-07, MV-01 |
| Detalhes cancelados | `design/onoreo.pen` / `dPHci` | Devolução e perda por linha | 1481 × 1050 | [dPHci.png](./dPHci.png) | `OrderItems`, `OrderSummary` | Cartões, status, `success`, `danger`; dados originais preservados | AC-04, MV-01 |

A confirmação contém cabeçalho, número, data, quantidade e total do pedido; três linhas com as duas escolhas, motivo opcional, aviso de preservação, ações Voltar e Cancelar pedido. As linhas de açaí e picolé mostram a devolução padrão; água mineral mostra perda selecionada. As referências de diálogo e detalhes usam pedidos ilustrativos diferentes; comparar estrutura e estados, não os mesmos itens. Os detalhes mantêm navegação, cabeçalho, três linhas, valores e informações de cancelamento; as linhas indicam devolução ou perda. O estado de destino excluído permanece apenas no fato auditável, conforme PRD. As capturas foram inspecionadas e não apresentaram problemas de layout nos nós mapeados. Os PNGs têm escala 1 e dimensões declaradas.

Cobertura complementar recomendada: diálogo em 375 × 812 com teclado e erro de envio; detalhes em 375 × 812 com nomes longos; detalhe com destino excluído apenas para comprovar ausência de indicador visual e presença no registro persistido. Não há frame Pencil estreito; a implementação deverá empilhar conteúdo, manter controles legíveis e validar esses estados em MV-01/MV-02. Essa cobertura pode ser capturada na validação runtime.

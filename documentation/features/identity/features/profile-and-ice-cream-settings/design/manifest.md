# Design reference manifest

Status: both frames and the My Account name-correction dialog were exported
through Pencil's WSL UNC shared path and verified in the repository workspace.

Source file: `design/onoreo.pen`

Export procedure: [create-spec-prompt.md](../../../../../prompts/create-spec-prompt.md#pencil-node-export-workflow)

| Reference | Pencil node | Intended state and viewport | Screenshot artifact | Implementation surface | Reusable design references | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| My Account | `BRpGr` — `Identity / Minha conta — Desktop` | Default desktop, `1481 × 1050` | [./BRpGr.png](./BRpGr.png) — verified PNG | `/account`: identity card, read-only account data, current-device session card | `K4g10V` Sidebar, `d8DadK` Header, `$bg-page`, `$bg-card`, `$border`, `$text-*`, `$primary`, Manrope, Lucide | Compare shell, hierarchy, card treatment, focus order, and responsive adaptation at 320px |
| My Account — name correction dialog | `Ih9Qc` — `Corrigir meu nome` | Interaction state opened from My Account; `676 × 502` | [./Ih9Qc.png](./Ih9Qc.png) — verified PNG | `/account`: self-name form, validation, informational history notice, save/cancel/focus behavior | Existing modal/form/button/input primitives, `$primary`, `$info-soft`, `$text-*`, Manrope, Lucide | Verify dialog labels, initial focus, validation/error announcement, save pending state, and keyboard escape/cancel path |
| Ice Cream Shop Settings | `m7W867` — `Identity / Configurações da sorveteria — Desktop` | Default desktop, `1551 × 1050` | [./m7W867.png](./m7W867.png) — verified PNG | `/shop-settings`: current shop identity and name mutation | `K4g10V` Sidebar, `d8DadK` Header, `$bg-page`, `$bg-card`, `$border`, `$text-*`, `$primary`, Manrope, Lucide | Compare shell and identity card; omit deletion/logo controls per the current Identity PRD |
| Manager sidebar — shop settings link | User-supplied supplemental reference | Sidebar footer state with Manager navigation; source crop `261 × 167` | [./sidebar-shop-settings-link.png](./sidebar-shop-settings-link.png) — verified PNG | Shared protected app shell on `/account` and `/shop-settings` | `K4g10V` Sidebar, `$primary-soft`, `$primary`, Lucide `store` | The `Sorveteria` link is visible for Managers on every protected page, navigates to `/shop-settings`, and is active on that route; it is absent for Operators |

## Inspection notes

- Pencil layout diagnostics returned no problems for `BRpGr` or `m7W867`.
- The shop-settings frame includes a deletion danger zone and logo controls.
  Those controls are intentionally not part of this feature: the current
  Identity PRD makes deletion unavailable and scopes this slice to the shop
  name.
- No mobile Pencil frame was supplied. The implementation must responsively
  adapt the inspected desktop compositions without introducing horizontal
  scrolling at 320px.
- `Ih9Qc` is an existing Pencil interaction node for the account name-correction
  dialog; it is included as a feature-local visual reference rather than a new
  top-level page.
- Both PNG exports were written through the WSL UNC shared path and verified as
  non-empty valid images with the dimensions declared above.
- The Manager sidebar link was added after the original Pencil captures. The supplied
  crop is therefore a supplemental visual reference and does not replace the original
  page compositions; implementation evidence must include the updated sidebar state.

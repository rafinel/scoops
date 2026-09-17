export const EstablishmentTimezone = {
  Noronha: 'America/Noronha',
  Belem: 'America/Belem',
  Fortaleza: 'America/Fortaleza',
  Recife: 'America/Recife',
  Araguaina: 'America/Araguaina',
  Maceio: 'America/Maceio',
  Bahia: 'America/Bahia',
  SaoPaulo: 'America/Sao_Paulo',
  CampoGrande: 'America/Campo_Grande',
  Cuiaba: 'America/Cuiaba',
  Santarem: 'America/Santarem',
  PortoVelho: 'America/Porto_Velho',
  BoaVista: 'America/Boa_Vista',
  Manaus: 'America/Manaus',
  Eirunepe: 'America/Eirunepe',
  RioBranco: 'America/Rio_Branco',
} as const

export type EstablishmentTimezone =
  (typeof EstablishmentTimezone)[keyof typeof EstablishmentTimezone]

export const DEFAULT_ESTABLISHMENT_TIMEZONE = EstablishmentTimezone.SaoPaulo

import type { ServeHandlerOptions } from 'inngest'

export type InngestOptions = Pick<ServeHandlerOptions, 'client' | 'functions'>

export const INNGEST_OPTIONS = Symbol('INNGEST_OPTIONS')

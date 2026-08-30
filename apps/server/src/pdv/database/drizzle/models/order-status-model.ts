import { pgEnum } from 'drizzle-orm/pg-core'

export const orderStatusModel = pgEnum('pdv_order_status', ['registered', 'canceled'])

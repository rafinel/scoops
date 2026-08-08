import { Injectable } from '@nestjs/common'
import { Inngest } from 'inngest'

@Injectable()
export class InngestClient extends Inngest {
  constructor() {
    super({ id: 'scoops-server' })
  }
}

export const inngest = new InngestClient()

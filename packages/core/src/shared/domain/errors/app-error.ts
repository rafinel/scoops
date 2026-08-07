export class AppError extends Error {
  constructor(
    public message: string = 'Erro interno da aplicação',
    public title: string = 'Erro Interno da Aplicação',
  ) {
    super(title)
  }
}

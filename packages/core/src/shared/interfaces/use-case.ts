export interface UseCase<Request, Response = void> {
  execute(request: Request): Promise<Response>
}

export interface BusinessRuleStrategy<Input, Output> {
  execute(input: Input): Output
}

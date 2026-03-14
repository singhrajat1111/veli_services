export interface CodeGenerator {
  generate6DigitCode(input: { contactNumber: string }): Promise<string>;
  generate4DigitCode(input: { contactNumber: string }): Promise<string>;
}

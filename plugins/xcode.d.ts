declare module "xcode" {
  interface XcodeProjectFile {
    parseSync(): void
    writeSync(): string
  }

  const xcode: { project(path: string): XcodeProjectFile }
  export default xcode
}

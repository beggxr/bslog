#!/usr/bin/env bun
// @bun
import { createRequire } from 'node:module'

const __create = Object.create
const __getProtoOf = Object.getPrototypeOf
const __defProp = Object.defineProperty
const __getOwnPropNames = Object.getOwnPropertyNames
const __hasOwnProp = Object.prototype.hasOwnProperty
const __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {}
  const to =
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target
  for (const key of __getOwnPropNames(mod)) {
    if (!__hasOwnProp.call(to, key)) {
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true,
      })
    }
  }
  return to
}
const __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports)
const __export = (target, all) => {
  for (const name in all) {
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => (all[name] = () => newValue),
    })
  }
}
const __esm = (fn, res) => () => (fn && (res = fn((fn = 0))), res)
const __require = /* @__PURE__ */ createRequire(import.meta.url)

// node_modules/commander/lib/error.js
const require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message)
      Error.captureStackTrace(this, this.constructor)
      this.name = this.constructor.name
      this.code = code
      this.exitCode = exitCode
      this.nestedError = undefined
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, 'commander.invalidArgument', message)
      Error.captureStackTrace(this, this.constructor)
      this.name = this.constructor.name
    }
  }
  exports.CommanderError = CommanderError
  exports.InvalidArgumentError = InvalidArgumentError
})

// node_modules/commander/lib/argument.js
const require_argument = __commonJS((exports) => {
  const { InvalidArgumentError } = require_error()

  class Argument {
    constructor(name, description) {
      this.description = description || ''
      this.variadic = false
      this.parseArg = undefined
      this.defaultValue = undefined
      this.defaultValueDescription = undefined
      this.argChoices = undefined
      switch (name[0]) {
        case '<':
          this.required = true
          this._name = name.slice(1, -1)
          break
        case '[':
          this.required = false
          this._name = name.slice(1, -1)
          break
        default:
          this.required = true
          this._name = name
          break
      }
      if (this._name.length > 3 && this._name.slice(-3) === '...') {
        this.variadic = true
        this._name = this._name.slice(0, -3)
      }
    }
    name() {
      return this._name
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value]
      }
      return previous.concat(value)
    }
    default(value, description) {
      this.defaultValue = value
      this.defaultValueDescription = description
      return this
    }
    argParser(fn) {
      this.parseArg = fn
      return this
    }
    choices(values) {
      this.argChoices = values.slice()
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`)
        }
        if (this.variadic) {
          return this._concatValue(arg, previous)
        }
        return arg
      }
      return this
    }
    argRequired() {
      this.required = true
      return this
    }
    argOptional() {
      this.required = false
      return this
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? '...' : '')
    return arg.required ? `<${nameOutput}>` : `[${nameOutput}]`
  }
  exports.Argument = Argument
  exports.humanReadableArgName = humanReadableArgName
})

// node_modules/commander/lib/help.js
const require_help = __commonJS((exports) => {
  const { humanReadableArgName } = require_argument()

  class Help {
    constructor() {
      this.helpWidth = undefined
      this.sortSubcommands = false
      this.sortOptions = false
      this.showGlobalOptions = false
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden)
      const helpCommand = cmd._getHelpCommand()
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand)
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name())
        })
      }
      return visibleCommands
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '')
      }
      return getSortKey(a).localeCompare(getSortKey(b))
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden)
      const helpOption = cmd._getHelpOption()
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short)
        const removeLong = helpOption.long && cmd._findOption(helpOption.long)
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption)
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description))
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description))
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions)
      }
      return visibleOptions
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions) {
        return []
      }
      const globalOptions = []
      for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden)
        globalOptions.push(...visibleOptions)
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions)
      }
      return globalOptions
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || ''
        })
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments
      }
      return []
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(' ')
      return (
        cmd._name +
        (cmd._aliases[0] ? `|${cmd._aliases[0]}` : '') +
        (cmd.options.length ? ' [options]' : '') +
        (args ? ` ${args}` : '')
      )
    }
    optionTerm(option) {
      return option.flags
    }
    argumentTerm(argument) {
      return argument.name()
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, helper.subcommandTerm(command).length)
      }, 0)
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length)
      }, 0)
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length)
      }, 0)
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, helper.argumentTerm(argument).length)
      }, 0)
    }
    commandUsage(cmd) {
      let cmdName = cmd._name
      if (cmd._aliases[0]) {
        cmdName = `${cmdName}|${cmd._aliases[0]}`
      }
      let ancestorCmdNames = ''
      for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = `${ancestorCmd.name()} ${ancestorCmdNames}`
      }
      return `${ancestorCmdNames + cmdName} ${cmd.usage()}`
    }
    commandDescription(cmd) {
      return cmd.description()
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description()
    }
    optionDescription(option) {
      const extraInfo = []
      if (option.argChoices) {
        extraInfo.push(
          `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
        )
      }
      if (option.defaultValue !== undefined) {
        const showDefault =
          option.required ||
          option.optional ||
          (option.isBoolean() && typeof option.defaultValue === 'boolean')
        if (showDefault) {
          extraInfo.push(
            `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`,
          )
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`)
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`)
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(', ')})`
      }
      return option.description
    }
    argumentDescription(argument) {
      const extraInfo = []
      if (argument.argChoices) {
        extraInfo.push(
          `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
        )
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(
          `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`,
        )
      }
      if (extraInfo.length > 0) {
        const extraDescripton = `(${extraInfo.join(', ')})`
        if (argument.description) {
          return `${argument.description} ${extraDescripton}`
        }
        return extraDescripton
      }
      return argument.description
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper)
      const helpWidth = helper.helpWidth || 80
      const itemIndentWidth = 2
      const itemSeparatorWidth = 2
      function formatItem(term, description) {
        if (description) {
          const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`
          return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth)
        }
        return term
      }
      function formatList(textArray) {
        return textArray
          .join(`
`)
          .replace(/^/gm, ' '.repeat(itemIndentWidth))
      }
      let output = [`Usage: ${helper.commandUsage(cmd)}`, '']
      const commandDescription = helper.commandDescription(cmd)
      if (commandDescription.length > 0) {
        output = output.concat([helper.wrap(commandDescription, helpWidth, 0), ''])
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument))
      })
      if (argumentList.length > 0) {
        output = output.concat(['Arguments:', formatList(argumentList), ''])
      }
      const optionList = helper.visibleOptions(cmd).map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option))
      })
      if (optionList.length > 0) {
        output = output.concat(['Options:', formatList(optionList), ''])
      }
      if (this.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return formatItem(helper.optionTerm(option), helper.optionDescription(option))
        })
        if (globalOptionList.length > 0) {
          output = output.concat(['Global Options:', formatList(globalOptionList), ''])
        }
      }
      const commandList = helper.visibleCommands(cmd).map((cmd2) => {
        return formatItem(helper.subcommandTerm(cmd2), helper.subcommandDescription(cmd2))
      })
      if (commandList.length > 0) {
        output = output.concat(['Commands:', formatList(commandList), ''])
      }
      return output.join(`
`)
    }
    padWidth(cmd, helper) {
      return Math.max(
        helper.longestOptionTermLength(cmd, helper),
        helper.longestGlobalOptionTermLength(cmd, helper),
        helper.longestSubcommandTermLength(cmd, helper),
        helper.longestArgumentTermLength(cmd, helper),
      )
    }
    wrap(str, width, indent, minColumnWidth = 40) {
      const indents = ' \\f\\t\\v   -   　\uFEFF'
      const manualIndent = new RegExp(`[\\n][${indents}]+`)
      if (str.match(manualIndent)) {
        return str
      }
      const columnWidth = width - indent
      if (columnWidth < minColumnWidth) {
        return str
      }
      const leadingStr = str.slice(0, indent)
      const columnText = str.slice(indent).replace(
        `\r
`,
        `
`,
      )
      const indentString = ' '.repeat(indent)
      const zeroWidthSpace = '​'
      const breaks = `\\s${zeroWidthSpace}`
      const regex = new RegExp(
        `
|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`,
        'g',
      )
      const lines = columnText.match(regex) || []
      return (
        leadingStr +
        lines
          .map((line, i) => {
            if (
              line ===
              `
`
            ) {
              return ''
            }
            return (i > 0 ? indentString : '') + line.trimEnd()
          })
          .join(`
`)
      )
    }
  }
  exports.Help = Help
})

// node_modules/commander/lib/option.js
const require_option = __commonJS((exports) => {
  const { InvalidArgumentError } = require_error()

  class Option {
    constructor(flags, description) {
      this.flags = flags
      this.description = description || ''
      this.required = flags.includes('<')
      this.optional = flags.includes('[')
      this.variadic = /\w\.\.\.[>\]]$/.test(flags)
      this.mandatory = false
      const optionFlags = splitOptionFlags(flags)
      this.short = optionFlags.shortFlag
      this.long = optionFlags.longFlag
      this.negate = false
      if (this.long) {
        this.negate = this.long.startsWith('--no-')
      }
      this.defaultValue = undefined
      this.defaultValueDescription = undefined
      this.presetArg = undefined
      this.envVar = undefined
      this.parseArg = undefined
      this.hidden = false
      this.argChoices = undefined
      this.conflictsWith = []
      this.implied = undefined
    }
    default(value, description) {
      this.defaultValue = value
      this.defaultValueDescription = description
      return this
    }
    preset(arg) {
      this.presetArg = arg
      return this
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names)
      return this
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues
      if (typeof impliedOptionValues === 'string') {
        newImplied = { [impliedOptionValues]: true }
      }
      this.implied = Object.assign(this.implied || {}, newImplied)
      return this
    }
    env(name) {
      this.envVar = name
      return this
    }
    argParser(fn) {
      this.parseArg = fn
      return this
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory
      return this
    }
    hideHelp(hide = true) {
      this.hidden = !!hide
      return this
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value]
      }
      return previous.concat(value)
    }
    choices(values) {
      this.argChoices = values.slice()
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`)
        }
        if (this.variadic) {
          return this._concatValue(arg, previous)
        }
        return arg
      }
      return this
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, '')
      }
      return this.short.replace(/^-/, '')
    }
    attributeName() {
      return camelcase(this.name().replace(/^no-/, ''))
    }
    is(arg) {
      return this.short === arg || this.long === arg
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map()
      this.negativeOptions = new Map()
      this.dualOptions = new Set()
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option)
        } else {
          this.positiveOptions.set(option.attributeName(), option)
        }
      })
      this.negativeOptions.forEach((_value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key)
        }
      })
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName()
      if (!this.dualOptions.has(optionKey)) {
        return true
      }
      const preset = this.negativeOptions.get(optionKey).presetArg
      const negativeValue = preset !== undefined ? preset : false
      return option.negate === (negativeValue === value)
    }
  }
  function camelcase(str) {
    return str.split('-').reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1)
    })
  }
  function splitOptionFlags(flags) {
    let shortFlag
    let longFlag
    const flagParts = flags.split(/[ |,]+/)
    if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) {
      shortFlag = flagParts.shift()
    }
    longFlag = flagParts.shift()
    if (!shortFlag && /^-[^-]$/.test(longFlag)) {
      shortFlag = longFlag
      longFlag = undefined
    }
    return { shortFlag, longFlag }
  }
  exports.Option = Option
  exports.DualOptions = DualOptions
})

// node_modules/commander/lib/suggestSimilar.js
const require_suggestSimilar = __commonJS((exports) => {
  const maxDistance = 3
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance) {
      return Math.max(a.length, b.length)
    }
    const d = []
    for (let i = 0; i <= a.length; i++) {
      d[i] = [i]
    }
    for (let j = 0; j <= b.length; j++) {
      d[0][j] = j
    }
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        let cost = 1
        if (a[i - 1] === b[j - 1]) {
          cost = 0
        } else {
          cost = 1
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
        }
      }
    }
    return d[a.length][b.length]
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0) {
      return ''
    }
    candidates = Array.from(new Set(candidates))
    const searchingOptions = word.startsWith('--')
    if (searchingOptions) {
      word = word.slice(2)
      candidates = candidates.map((candidate) => candidate.slice(2))
    }
    let similar = []
    let bestDistance = maxDistance
    const minSimilarity = 0.4
    candidates.forEach((candidate) => {
      if (candidate.length <= 1) {
        return
      }
      const distance = editDistance(word, candidate)
      const length = Math.max(word.length, candidate.length)
      const similarity = (length - distance) / length
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance
          similar = [candidate]
        } else if (distance === bestDistance) {
          similar.push(candidate)
        }
      }
    })
    similar.sort((a, b) => a.localeCompare(b))
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`)
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(', ')}?)`
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`
    }
    return ''
  }
  exports.suggestSimilar = suggestSimilar
})

// node_modules/commander/lib/command.js
const require_command = __commonJS((exports) => {
  const EventEmitter = __require('node:events').EventEmitter
  const childProcess = __require('node:child_process')
  const path = __require('node:path')
  const fs = __require('node:fs')
  const process2 = __require('node:process')
  const { Argument, humanReadableArgName } = require_argument()
  const { CommanderError } = require_error()
  const { Help } = require_help()
  const { Option, DualOptions } = require_option()
  const { suggestSimilar } = require_suggestSimilar()

  class Command extends EventEmitter {
    constructor(name) {
      super()
      this.commands = []
      this.options = []
      this.parent = null
      this._allowUnknownOption = false
      this._allowExcessArguments = true
      this.registeredArguments = []
      this._args = this.registeredArguments
      this.args = []
      this.rawArgs = []
      this.processedArgs = []
      this._scriptPath = null
      this._name = name || ''
      this._optionValues = {}
      this._optionValueSources = {}
      this._storeOptionsAsProperties = false
      this._actionHandler = null
      this._executableHandler = false
      this._executableFile = null
      this._executableDir = null
      this._defaultCommandName = null
      this._exitCallback = null
      this._aliases = []
      this._combineFlagAndOptionalValue = true
      this._description = ''
      this._summary = ''
      this._argsDescription = undefined
      this._enablePositionalOptions = false
      this._passThroughOptions = false
      this._lifeCycleHooks = {}
      this._showHelpAfterError = false
      this._showSuggestionAfterError = true
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        getOutHelpWidth: () => (process2.stdout.isTTY ? process2.stdout.columns : undefined),
        getErrHelpWidth: () => (process2.stderr.isTTY ? process2.stderr.columns : undefined),
        outputError: (str, write) => write(str),
      }
      this._hidden = false
      this._helpOption = undefined
      this._addImplicitHelpCommand = undefined
      this._helpCommand = undefined
      this._helpConfiguration = {}
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration
      this._helpOption = sourceCommand._helpOption
      this._helpCommand = sourceCommand._helpCommand
      this._helpConfiguration = sourceCommand._helpConfiguration
      this._exitCallback = sourceCommand._exitCallback
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue
      this._allowExcessArguments = sourceCommand._allowExcessArguments
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions
      this._showHelpAfterError = sourceCommand._showHelpAfterError
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError
      return this
    }
    _getCommandAndAncestors() {
      const result = []
      for (let command = this; command; command = command.parent) {
        result.push(command)
      }
      return result
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc
      let opts = execOpts
      if (typeof desc === 'object' && desc !== null) {
        opts = desc
        desc = null
      }
      opts = opts || {}
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/)
      const cmd = this.createCommand(name)
      if (desc) {
        cmd.description(desc)
        cmd._executableHandler = true
      }
      if (opts.isDefault) {
        this._defaultCommandName = cmd._name
      }
      cmd._hidden = !!(opts.noHelp || opts.hidden)
      cmd._executableFile = opts.executableFile || null
      if (args) {
        cmd.arguments(args)
      }
      this._registerCommand(cmd)
      cmd.parent = this
      cmd.copyInheritedSettings(this)
      if (desc) {
        return this
      }
      return cmd
    }
    createCommand(name) {
      return new Command(name)
    }
    createHelp() {
      return Object.assign(new Help(), this.configureHelp())
    }
    configureHelp(configuration) {
      if (configuration === undefined) {
        return this._helpConfiguration
      }
      this._helpConfiguration = configuration
      return this
    }
    configureOutput(configuration) {
      if (configuration === undefined) {
        return this._outputConfiguration
      }
      Object.assign(this._outputConfiguration, configuration)
      return this
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== 'string') {
        displayHelp = !!displayHelp
      }
      this._showHelpAfterError = displayHelp
      return this
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion
      return this
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`)
      }
      opts = opts || {}
      if (opts.isDefault) {
        this._defaultCommandName = cmd._name
      }
      if (opts.noHelp || opts.hidden) {
        cmd._hidden = true
      }
      this._registerCommand(cmd)
      cmd.parent = this
      cmd._checkForBrokenPassThrough()
      return this
    }
    createArgument(name, description) {
      return new Argument(name, description)
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description)
      if (typeof fn === 'function') {
        argument.default(defaultValue).argParser(fn)
      } else {
        argument.default(fn)
      }
      this.addArgument(argument)
      return this
    }
    arguments(names) {
      names
        .trim()
        .split(/ +/)
        .forEach((detail) => {
          this.argument(detail)
        })
      return this
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0]
      if (previousArgument?.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`)
      }
      if (
        argument.required &&
        argument.defaultValue !== undefined &&
        argument.parseArg === undefined
      ) {
        throw new Error(
          `a default value for a required argument is never used: '${argument.name()}'`,
        )
      }
      this.registeredArguments.push(argument)
      return this
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === 'boolean') {
        this._addImplicitHelpCommand = enableOrNameAndArgs
        return this
      }
      enableOrNameAndArgs = enableOrNameAndArgs ?? 'help [command]'
      const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/)
      const helpDescription = description ?? 'display help for command'
      const helpCommand = this.createCommand(helpName)
      helpCommand.helpOption(false)
      if (helpArgs) {
        helpCommand.arguments(helpArgs)
      }
      if (helpDescription) {
        helpCommand.description(helpDescription)
      }
      this._addImplicitHelpCommand = true
      this._helpCommand = helpCommand
      return this
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== 'object') {
        this.helpCommand(helpCommand, deprecatedDescription)
        return this
      }
      this._addImplicitHelpCommand = true
      this._helpCommand = helpCommand
      return this
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand =
        this._addImplicitHelpCommand ??
        (this.commands.length && !this._actionHandler && !this._findCommand('help'))
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined)
        }
        return this._helpCommand
      }
      return null
    }
    hook(event, listener) {
      const allowedValues = ['preSubcommand', 'preAction', 'postAction']
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`)
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener)
      } else {
        this._lifeCycleHooks[event] = [listener]
      }
      return this
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn
      } else {
        this._exitCallback = (err) => {
          if (err.code !== 'commander.executeSubCommandAsync') {
            throw err
          }
        }
      }
      return this
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message))
      }
      process2.exit(exitCode)
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length
        const actionArgs = args.slice(0, expectedArgsCount)
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this
        } else {
          actionArgs[expectedArgsCount] = this.opts()
        }
        actionArgs.push(this)
        return fn.apply(this, actionArgs)
      }
      this._actionHandler = listener
      return this
    }
    createOption(flags, description) {
      return new Option(flags, description)
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous)
      } catch (err) {
        if (err.code === 'commander.invalidArgument') {
          const message = `${invalidArgumentMessage} ${err.message}`
          this.error(message, { exitCode: err.exitCode, code: err.code })
        }
        throw err
      }
    }
    _registerOption(option) {
      const matchingOption =
        (option.short && this._findOption(option.short)) ||
        (option.long && this._findOption(option.long))
      if (matchingOption) {
        const matchingFlag =
          option.long && this._findOption(option.long) ? option.long : option.short
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`)
      }
      this.options.push(option)
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases())
      }
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name))
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join('|')
        const newCmd = knownBy(command).join('|')
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`)
      }
      this.commands.push(command)
    }
    addOption(option) {
      this._registerOption(option)
      const oname = option.name()
      const name = option.attributeName()
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, '--')
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(
            name,
            option.defaultValue === undefined ? true : option.defaultValue,
            'default',
          )
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, 'default')
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg
        }
        const oldValue = this.getOptionValue(name)
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage)
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue)
        }
        if (val == null) {
          if (option.negate) {
            val = false
          } else if (option.isBoolean() || option.optional) {
            val = true
          } else {
            val = ''
          }
        }
        this.setOptionValueWithSource(name, val, valueSource)
      }
      this.on(`option:${oname}`, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`
        handleOptionValue(val, invalidValueMessage, 'cli')
      })
      if (option.envVar) {
        this.on(`optionEnv:${oname}`, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`
          handleOptionValue(val, invalidValueMessage, 'env')
        })
      }
      return this
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === 'object' && flags instanceof Option) {
        throw new Error(
          'To add an Option object use addOption() instead of option() or requiredOption()',
        )
      }
      const option = this.createOption(flags, description)
      option.makeOptionMandatory(!!config.mandatory)
      if (typeof fn === 'function') {
        option.default(defaultValue).argParser(fn)
      } else if (fn instanceof RegExp) {
        const regex = fn
        fn = (val, def) => {
          const m = regex.exec(val)
          return m ? m[0] : def
        }
        option.default(defaultValue).argParser(fn)
      } else {
        option.default(fn)
      }
      return this.addOption(option)
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue)
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue)
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine
      return this
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown
      return this
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess
      return this
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional
      return this
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough
      this._checkForBrokenPassThrough()
      return this
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(
          `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`,
        )
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error('call .storeOptionsAsProperties() before adding options')
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error('call .storeOptionsAsProperties() before setting option values')
      }
      this._storeOptionsAsProperties = !!storeAsProperties
      return this
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key]
      }
      return this._optionValues[key]
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined)
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value
      } else {
        this._optionValues[key] = value
      }
      this._optionValueSources[key] = source
      return this
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key]
    }
    getOptionValueSourceWithGlobals(key) {
      let source
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key)
        }
      })
      return source
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error('first parameter to parse must be array or undefined')
      }
      parseOptions = parseOptions || {}
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = 'electron'
        }
        const execArgv = process2.execArgv ?? []
        if (
          execArgv.includes('-e') ||
          execArgv.includes('--eval') ||
          execArgv.includes('-p') ||
          execArgv.includes('--print')
        ) {
          parseOptions.from = 'eval'
        }
      }
      if (argv === undefined) {
        argv = process2.argv
      }
      this.rawArgs = argv.slice()
      let userArgs
      switch (parseOptions.from) {
        case undefined:
        case 'node':
          this._scriptPath = argv[1]
          userArgs = argv.slice(2)
          break
        case 'electron':
          if (process2.defaultApp) {
            this._scriptPath = argv[1]
            userArgs = argv.slice(2)
          } else {
            userArgs = argv.slice(1)
          }
          break
        case 'user':
          userArgs = argv.slice(0)
          break
        case 'eval':
          userArgs = argv.slice(1)
          break
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`)
      }
      if (!this._name && this._scriptPath) {
        this.nameFromFilename(this._scriptPath)
      }
      this._name = this._name || 'program'
      return userArgs
    }
    parse(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions)
      this._parseCommand([], userArgs)
      return this
    }
    async parseAsync(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions)
      await this._parseCommand([], userArgs)
      return this
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice()
      let launchWithNode = false
      const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs']
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName)
        if (fs.existsSync(localBin)) {
          return localBin
        }
        if (sourceExt.includes(path.extname(baseName))) {
          return
        }
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`))
        if (foundExt) {
          return `${localBin}${foundExt}`
        }
        return
      }
      this._checkForMissingMandatoryOptions()
      this._checkForConflictingOptions()
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`
      let executableDir = this._executableDir || ''
      if (this._scriptPath) {
        let resolvedScriptPath
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath)
        } catch (_err) {
          resolvedScriptPath = this._scriptPath
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir)
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile)
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath))
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`)
          }
        }
        executableFile = localFile || executableFile
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile))
      let proc
      if (process2.platform !== 'win32') {
        if (launchWithNode) {
          args.unshift(executableFile)
          args = incrementNodeInspectorPort(process2.execArgv).concat(args)
          proc = childProcess.spawn(process2.argv[0], args, { stdio: 'inherit' })
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' })
        }
      } else {
        args.unshift(executableFile)
        args = incrementNodeInspectorPort(process2.execArgv).concat(args)
        proc = childProcess.spawn(process2.execPath, args, { stdio: 'inherit' })
      }
      if (!proc.killed) {
        const signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP']
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal)
            }
          })
        })
      }
      const exitCallback = this._exitCallback
      proc.on('close', (code) => {
        code = code ?? 1
        if (exitCallback) {
          exitCallback(new CommanderError(code, 'commander.executeSubCommandAsync', '(close)'))
        } else {
          process2.exit(code)
        }
      })
      proc.on('error', (err) => {
        if (err.code === 'ENOENT') {
          const executableDirMessage = executableDir
            ? `searched for local subcommand relative to directory '${executableDir}'`
            : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory'
          const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`
          throw new Error(executableMissing)
        }
        if (err.code === 'EACCES') {
          throw new Error(`'${executableFile}' not executable`)
        }
        if (exitCallback) {
          const wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)')
          wrappedError.nestedError = err
          exitCallback(wrappedError)
        } else {
          process2.exit(1)
        }
      })
      this.runningCommand = proc
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName)
      if (!subCommand) {
        this.help({ error: true })
      }
      let promiseChain
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, 'preSubcommand')
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown))
        } else {
          return subCommand._parseCommand(operands, unknown)
        }
      })
      return promiseChain
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help()
      }
      const subCommand = this._findCommand(subcommandName)
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help()
      }
      return this._dispatchSubcommand(
        subcommandName,
        [],
        [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? '--help'],
      )
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name())
        }
      })
      if (
        this.registeredArguments.length > 0 &&
        this.registeredArguments[this.registeredArguments.length - 1].variadic
      ) {
        return
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args)
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage)
        }
        return parsedValue
      }
      this._checkNumberOfArguments()
      const processedArgs = []
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index)
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed)
              }, declaredArg.defaultValue)
            }
          } else if (value === undefined) {
            value = []
          }
        } else if (index < this.args.length) {
          value = this.args[index]
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue)
          }
        }
        processedArgs[index] = value
      })
      this.processedArgs = processedArgs
    }
    _chainOrCall(promise, fn) {
      if (promise?.then && typeof promise.then === 'function') {
        return promise.then(() => fn())
      }
      return fn()
    }
    _chainOrCallHooks(promise, event) {
      let result = promise
      const hooks = []
      this._getCommandAndAncestors()
        .reverse()
        .filter((cmd) => cmd._lifeCycleHooks[event] !== undefined)
        .forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback })
          })
        })
      if (event === 'postAction') {
        hooks.reverse()
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this)
        })
      })
      return result
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand)
          })
        })
      }
      return result
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown)
      this._parseOptionsEnv()
      this._parseOptionsImplied()
      operands = operands.concat(parsed.operands)
      unknown = parsed.unknown
      this.args = operands.concat(unknown)
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown)
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1])
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown)
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown)
      }
      if (
        this.commands.length &&
        this.args.length === 0 &&
        !this._actionHandler &&
        !this._defaultCommandName
      ) {
        this.help({ error: true })
      }
      this._outputHelpIfRequested(parsed.unknown)
      this._checkForMissingMandatoryOptions()
      this._checkForConflictingOptions()
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0])
        }
      }
      const commandEvent = `command:${this.name()}`
      if (this._actionHandler) {
        checkForUnknownOptions()
        this._processArguments()
        let promiseChain
        promiseChain = this._chainOrCallHooks(promiseChain, 'preAction')
        promiseChain = this._chainOrCall(promiseChain, () =>
          this._actionHandler(this.processedArgs),
        )
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown)
          })
        }
        promiseChain = this._chainOrCallHooks(promiseChain, 'postAction')
        return promiseChain
      }
      if (this.parent?.listenerCount(commandEvent)) {
        checkForUnknownOptions()
        this._processArguments()
        this.parent.emit(commandEvent, operands, unknown)
      } else if (operands.length) {
        if (this._findCommand('*')) {
          return this._dispatchSubcommand('*', operands, unknown)
        }
        if (this.listenerCount('command:*')) {
          this.emit('command:*', operands, unknown)
        } else if (this.commands.length) {
          this.unknownCommand()
        } else {
          checkForUnknownOptions()
          this._processArguments()
        }
      } else if (this.commands.length) {
        checkForUnknownOptions()
        this.help({ error: true })
      } else {
        checkForUnknownOptions()
        this._processArguments()
      }
    }
    _findCommand(name) {
      if (!name) {
        return
      }
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name))
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg))
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption)
          }
        })
      })
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName()
        if (this.getOptionValue(optionKey) === undefined) {
          return false
        }
        return this.getOptionValueSource(optionKey) !== 'default'
      })
      const optionsWithConflicting = definedNonDefaultOptions.filter(
        (option) => option.conflictsWith.length > 0,
      )
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
          option.conflictsWith.includes(defined.attributeName()),
        )
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined)
        }
      })
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions()
      })
    }
    parseOptions(argv) {
      const operands = []
      const unknown = []
      let dest = operands
      const args = argv.slice()
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === '-'
      }
      let activeVariadicOption = null
      while (args.length) {
        const arg = args.shift()
        if (arg === '--') {
          if (dest === unknown) {
            dest.push(arg)
          }
          dest.push(...args)
          break
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg)
          continue
        }
        activeVariadicOption = null
        if (maybeOption(arg)) {
          const option = this._findOption(arg)
          if (option) {
            if (option.required) {
              const value = args.shift()
              if (value === undefined) {
                this.optionMissingArgument(option)
              }
              this.emit(`option:${option.name()}`, value)
            } else if (option.optional) {
              let value = null
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift()
              }
              this.emit(`option:${option.name()}`, value)
            } else {
              this.emit(`option:${option.name()}`)
            }
            activeVariadicOption = option.variadic ? option : null
            continue
          }
        }
        if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
          const option = this._findOption(`-${arg[1]}`)
          if (option) {
            if (option.required || (option.optional && this._combineFlagAndOptionalValue)) {
              this.emit(`option:${option.name()}`, arg.slice(2))
            } else {
              this.emit(`option:${option.name()}`)
              args.unshift(`-${arg.slice(2)}`)
            }
            continue
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf('=')
          const option = this._findOption(arg.slice(0, index))
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1))
            continue
          }
        }
        if (maybeOption(arg)) {
          dest = unknown
        }
        if (
          (this._enablePositionalOptions || this._passThroughOptions) &&
          operands.length === 0 &&
          unknown.length === 0
        ) {
          if (this._findCommand(arg)) {
            operands.push(arg)
            if (args.length > 0) {
              unknown.push(...args)
            }
            break
          }
          if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg)
            if (args.length > 0) {
              operands.push(...args)
            }
            break
          }
          if (this._defaultCommandName) {
            unknown.push(arg)
            if (args.length > 0) {
              unknown.push(...args)
            }
            break
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg)
          if (args.length > 0) {
            dest.push(...args)
          }
          break
        }
        dest.push(arg)
      }
      return { operands, unknown }
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {}
        const len = this.options.length
        for (let i = 0; i < len; i++) {
          const key = this.options[i].attributeName()
          result[key] = key === this._versionOptionName ? this._version : this[key]
        }
        return result
      }
      return this._optionValues
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce(
        (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
        {},
      )
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(
        `${message}
`,
        this._outputConfiguration.writeErr,
      )
      if (typeof this._showHelpAfterError === 'string') {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`)
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`)
        this.outputHelp({ error: true })
      }
      const config = errorOptions || {}
      const exitCode = config.exitCode || 1
      const code = config.code || 'commander.error'
      this._exit(exitCode, code, message)
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName()
          if (
            this.getOptionValue(optionKey) === undefined ||
            ['default', 'config', 'env'].includes(this.getOptionValueSource(optionKey))
          ) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar])
            } else {
              this.emit(`optionEnv:${option.name()}`)
            }
          }
        }
      })
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options)
      const hasCustomOptionValue = (optionKey) => {
        return (
          this.getOptionValue(optionKey) !== undefined &&
          !['default', 'implied'].includes(this.getOptionValueSource(optionKey))
        )
      }
      this.options
        .filter(
          (option) =>
            option.implied !== undefined &&
            hasCustomOptionValue(option.attributeName()) &&
            dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option),
        )
        .forEach((option) => {
          Object.keys(option.implied)
            .filter((impliedKey) => !hasCustomOptionValue(impliedKey))
            .forEach((impliedKey) => {
              this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied')
            })
        })
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`
      this.error(message, { code: 'commander.missingArgument' })
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`
      this.error(message, { code: 'commander.optionMissingArgument' })
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`
      this.error(message, { code: 'commander.missingMandatoryOptionValue' })
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName()
        const optionValue = this.getOptionValue(optionKey)
        const negativeOption = this.options.find(
          (target) => target.negate && optionKey === target.attributeName(),
        )
        const positiveOption = this.options.find(
          (target) => !target.negate && optionKey === target.attributeName(),
        )
        if (
          negativeOption &&
          ((negativeOption.presetArg === undefined && optionValue === false) ||
            (negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg))
        ) {
          return negativeOption
        }
        return positiveOption || option2
      }
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2)
        const optionKey = bestOption.attributeName()
        const source = this.getOptionValueSource(optionKey)
        if (source === 'env') {
          return `environment variable '${bestOption.envVar}'`
        }
        return `option '${bestOption.flags}'`
      }
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`
      this.error(message, { code: 'commander.conflictingOption' })
    }
    unknownOption(flag) {
      if (this._allowUnknownOption) {
        return
      }
      let suggestion = ''
      if (flag.startsWith('--') && this._showSuggestionAfterError) {
        let candidateFlags = []
        let command = this
        do {
          const moreFlags = command
            .createHelp()
            .visibleOptions(command)
            .filter((option) => option.long)
            .map((option) => option.long)
          candidateFlags = candidateFlags.concat(moreFlags)
          command = command.parent
        } while (command && !command._enablePositionalOptions)
        suggestion = suggestSimilar(flag, candidateFlags)
      }
      const message = `error: unknown option '${flag}'${suggestion}`
      this.error(message, { code: 'commander.unknownOption' })
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments) {
        return
      }
      const expected = this.registeredArguments.length
      const s = expected === 1 ? '' : 's'
      const forSubcommand = this.parent ? ` for '${this.name()}'` : ''
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`
      this.error(message, { code: 'commander.excessArguments' })
    }
    unknownCommand() {
      const unknownName = this.args[0]
      let suggestion = ''
      if (this._showSuggestionAfterError) {
        const candidateNames = []
        this.createHelp()
          .visibleCommands(this)
          .forEach((command) => {
            candidateNames.push(command.name())
            if (command.alias()) {
              candidateNames.push(command.alias())
            }
          })
        suggestion = suggestSimilar(unknownName, candidateNames)
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`
      this.error(message, { code: 'commander.unknownCommand' })
    }
    version(str, flags, description) {
      if (str === undefined) {
        return this._version
      }
      this._version = str
      flags = flags || '-V, --version'
      description = description || 'output the version number'
      const versionOption = this.createOption(flags, description)
      this._versionOptionName = versionOption.attributeName()
      this._registerOption(versionOption)
      this.on(`option:${versionOption.name()}`, () => {
        this._outputConfiguration.writeOut(`${str}
`)
        this._exit(0, 'commander.version', str)
      })
      return this
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined) {
        return this._description
      }
      this._description = str
      if (argsDescription) {
        this._argsDescription = argsDescription
      }
      return this
    }
    summary(str) {
      if (str === undefined) {
        return this._summary
      }
      this._summary = str
      return this
    }
    alias(alias) {
      if (alias === undefined) {
        return this._aliases[0]
      }
      let command = this
      if (
        this.commands.length !== 0 &&
        this.commands[this.commands.length - 1]._executableHandler
      ) {
        command = this.commands[this.commands.length - 1]
      }
      if (alias === command._name) {
        throw new Error("Command alias can't be the same as its name")
      }
      const matchingCommand = this.parent?._findCommand(alias)
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join('|')
        throw new Error(
          `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`,
        )
      }
      command._aliases.push(alias)
      return this
    }
    aliases(aliases) {
      if (aliases === undefined) {
        return this._aliases
      }
      aliases.forEach((alias) => this.alias(alias))
      return this
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage) {
          return this._usage
        }
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg)
        })
        return []
          .concat(
            this.options.length || this._helpOption !== null ? '[options]' : [],
            this.commands.length ? '[command]' : [],
            this.registeredArguments.length ? args : [],
          )
          .join(' ')
      }
      this._usage = str
      return this
    }
    name(str) {
      if (str === undefined) {
        return this._name
      }
      this._name = str
      return this
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename))
      return this
    }
    executableDir(path2) {
      if (path2 === undefined) {
        return this._executableDir
      }
      this._executableDir = path2
      return this
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp()
      if (helper.helpWidth === undefined) {
        helper.helpWidth = contextOptions?.error
          ? this._outputConfiguration.getErrHelpWidth()
          : this._outputConfiguration.getOutHelpWidth()
      }
      return helper.formatHelp(this, helper)
    }
    _getHelpContext(contextOptions) {
      contextOptions = contextOptions || {}
      const context = { error: !!contextOptions.error }
      let write
      if (context.error) {
        write = (arg) => this._outputConfiguration.writeErr(arg)
      } else {
        write = (arg) => this._outputConfiguration.writeOut(arg)
      }
      context.write = contextOptions.write || write
      context.command = this
      return context
    }
    outputHelp(contextOptions) {
      let deprecatedCallback
      if (typeof contextOptions === 'function') {
        deprecatedCallback = contextOptions
        contextOptions = undefined
      }
      const context = this._getHelpContext(contextOptions)
      this._getCommandAndAncestors()
        .reverse()
        .forEach((command) => command.emit('beforeAllHelp', context))
      this.emit('beforeHelp', context)
      let helpInformation = this.helpInformation(context)
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation)
        if (typeof helpInformation !== 'string' && !Buffer.isBuffer(helpInformation)) {
          throw new Error('outputHelp callback must return a string or a Buffer')
        }
      }
      context.write(helpInformation)
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long)
      }
      this.emit('afterHelp', context)
      this._getCommandAndAncestors().forEach((command) => command.emit('afterAllHelp', context))
    }
    helpOption(flags, description) {
      if (typeof flags === 'boolean') {
        if (flags) {
          this._helpOption = this._helpOption ?? undefined
        } else {
          this._helpOption = null
        }
        return this
      }
      flags = flags ?? '-h, --help'
      description = description ?? 'display help for command'
      this._helpOption = this.createOption(flags, description)
      return this
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined)
      }
      return this._helpOption
    }
    addHelpOption(option) {
      this._helpOption = option
      return this
    }
    help(contextOptions) {
      this.outputHelp(contextOptions)
      let exitCode = process2.exitCode || 0
      if (
        exitCode === 0 &&
        contextOptions &&
        typeof contextOptions !== 'function' &&
        contextOptions.error
      ) {
        exitCode = 1
      }
      this._exit(exitCode, 'commander.help', '(outputHelp)')
    }
    addHelpText(position, text) {
      const allowedValues = ['beforeAll', 'before', 'after', 'afterAll']
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`)
      }
      const helpEvent = `${position}Help`
      this.on(helpEvent, (context) => {
        let helpStr
        if (typeof text === 'function') {
          helpStr = text({ error: context.error, command: context.command })
        } else {
          helpStr = text
        }
        if (helpStr) {
          context.write(`${helpStr}
`)
        }
      })
      return this
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption()
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg))
      if (helpRequested) {
        this.outputHelp()
        this._exit(0, 'commander.helpDisplayed', '(outputHelp)')
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith('--inspect')) {
        return arg
      }
      let debugOption
      let debugHost = '127.0.0.1'
      let debugPort = '9229'
      let match
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1]
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1]
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3]
        } else {
          debugHost = match[3]
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1]
        debugHost = match[3]
        debugPort = match[4]
      }
      if (debugOption && debugPort !== '0') {
        return `${debugOption}=${debugHost}:${Number.parseInt(debugPort, 10) + 1}`
      }
      return arg
    })
  }
  exports.Command = Command
})

// node_modules/commander/index.js
const require_commander = __commonJS((exports) => {
  const { Argument } = require_argument()
  const { Command } = require_command()
  const { CommanderError, InvalidArgumentError } = require_error()
  const { Help } = require_help()
  const { Option } = require_option()
  exports.program = new Command()
  exports.createCommand = (name) => new Command(name)
  exports.createOption = (flags, description) => new Option(flags, description)
  exports.createArgument = (name, description) => new Argument(name, description)
  exports.Command = Command
  exports.Option = Option
  exports.Argument = Argument
  exports.Help = Help
  exports.CommanderError = CommanderError
  exports.InvalidArgumentError = InvalidArgumentError
  exports.InvalidOptionArgumentError = InvalidArgumentError
})

// node_modules/web-streams-polyfill/dist/ponyfill.es2018.js
const require_ponyfill_es2018 = __commonJS((exports, module) => {
  ;((global2, factory) => {
    typeof exports === 'object' && typeof module !== 'undefined'
      ? factory(exports)
      : typeof define === 'function' && define.amd
        ? define(['exports'], factory)
        : ((global2 = typeof globalThis !== 'undefined' ? globalThis : global2 || self),
          factory((global2.WebStreamsPolyfill = {})))
  })(exports, (exports2) => {
    function noop() {
      return
    }
    function typeIsObject(x) {
      return (typeof x === 'object' && x !== null) || typeof x === 'function'
    }
    const rethrowAssertionErrorRejection = noop
    function setFunctionName(fn, name) {
      try {
        Object.defineProperty(fn, 'name', {
          value: name,
          configurable: true,
        })
      } catch (_a2) {}
    }
    const originalPromise = Promise
    const originalPromiseThen = Promise.prototype.then
    const originalPromiseReject = Promise.reject.bind(originalPromise)
    function newPromise(executor) {
      return new originalPromise(executor)
    }
    function promiseResolvedWith(value) {
      return newPromise((resolve) => resolve(value))
    }
    function promiseRejectedWith(reason) {
      return originalPromiseReject(reason)
    }
    function PerformPromiseThen(promise, onFulfilled, onRejected) {
      return originalPromiseThen.call(promise, onFulfilled, onRejected)
    }
    function uponPromise(promise, onFulfilled, onRejected) {
      PerformPromiseThen(
        PerformPromiseThen(promise, onFulfilled, onRejected),
        undefined,
        rethrowAssertionErrorRejection,
      )
    }
    function uponFulfillment(promise, onFulfilled) {
      uponPromise(promise, onFulfilled)
    }
    function uponRejection(promise, onRejected) {
      uponPromise(promise, undefined, onRejected)
    }
    function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
      return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler)
    }
    function setPromiseIsHandledToTrue(promise) {
      PerformPromiseThen(promise, undefined, rethrowAssertionErrorRejection)
    }
    let _queueMicrotask = (callback) => {
      if (typeof queueMicrotask === 'function') {
        _queueMicrotask = queueMicrotask
      } else {
        const resolvedPromise = promiseResolvedWith(undefined)
        _queueMicrotask = (cb) => PerformPromiseThen(resolvedPromise, cb)
      }
      return _queueMicrotask(callback)
    }
    function reflectCall(F, V, args) {
      if (typeof F !== 'function') {
        throw new TypeError('Argument is not a function')
      }
      return Function.prototype.apply.call(F, V, args)
    }
    function promiseCall(F, V, args) {
      try {
        return promiseResolvedWith(reflectCall(F, V, args))
      } catch (value) {
        return promiseRejectedWith(value)
      }
    }
    const QUEUE_MAX_ARRAY_SIZE = 16384

    class SimpleQueue {
      constructor() {
        this._cursor = 0
        this._size = 0
        this._front = {
          _elements: [],
          _next: undefined,
        }
        this._back = this._front
        this._cursor = 0
        this._size = 0
      }
      get length() {
        return this._size
      }
      push(element) {
        const oldBack = this._back
        let newBack = oldBack
        if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
          newBack = {
            _elements: [],
            _next: undefined,
          }
        }
        oldBack._elements.push(element)
        if (newBack !== oldBack) {
          this._back = newBack
          oldBack._next = newBack
        }
        ++this._size
      }
      shift() {
        const oldFront = this._front
        let newFront = oldFront
        const oldCursor = this._cursor
        let newCursor = oldCursor + 1
        const elements = oldFront._elements
        const element = elements[oldCursor]
        if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
          newFront = oldFront._next
          newCursor = 0
        }
        --this._size
        this._cursor = newCursor
        if (oldFront !== newFront) {
          this._front = newFront
        }
        elements[oldCursor] = undefined
        return element
      }
      forEach(callback) {
        let i = this._cursor
        let node = this._front
        let elements = node._elements
        while (i !== elements.length || node._next !== undefined) {
          if (i === elements.length) {
            node = node._next
            elements = node._elements
            i = 0
            if (elements.length === 0) {
              break
            }
          }
          callback(elements[i])
          ++i
        }
      }
      peek() {
        const front = this._front
        const cursor = this._cursor
        return front._elements[cursor]
      }
    }
    const AbortSteps = Symbol('[[AbortSteps]]')
    const ErrorSteps = Symbol('[[ErrorSteps]]')
    const CancelSteps = Symbol('[[CancelSteps]]')
    const PullSteps = Symbol('[[PullSteps]]')
    const ReleaseSteps = Symbol('[[ReleaseSteps]]')
    function ReadableStreamReaderGenericInitialize(reader, stream) {
      reader._ownerReadableStream = stream
      stream._reader = reader
      if (stream._state === 'readable') {
        defaultReaderClosedPromiseInitialize(reader)
      } else if (stream._state === 'closed') {
        defaultReaderClosedPromiseInitializeAsResolved(reader)
      } else {
        defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError)
      }
    }
    function ReadableStreamReaderGenericCancel(reader, reason) {
      const stream = reader._ownerReadableStream
      return ReadableStreamCancel(stream, reason)
    }
    function ReadableStreamReaderGenericRelease(reader) {
      const stream = reader._ownerReadableStream
      if (stream._state === 'readable') {
        defaultReaderClosedPromiseReject(
          reader,
          new TypeError(
            `Reader was released and can no longer be used to monitor the stream's closedness`,
          ),
        )
      } else {
        defaultReaderClosedPromiseResetToRejected(
          reader,
          new TypeError(
            `Reader was released and can no longer be used to monitor the stream's closedness`,
          ),
        )
      }
      stream._readableStreamController[ReleaseSteps]()
      stream._reader = undefined
      reader._ownerReadableStream = undefined
    }
    function readerLockException(name) {
      return new TypeError(`Cannot ${name} a stream using a released reader`)
    }
    function defaultReaderClosedPromiseInitialize(reader) {
      reader._closedPromise = newPromise((resolve, reject) => {
        reader._closedPromise_resolve = resolve
        reader._closedPromise_reject = reject
      })
    }
    function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
      defaultReaderClosedPromiseInitialize(reader)
      defaultReaderClosedPromiseReject(reader, reason)
    }
    function defaultReaderClosedPromiseInitializeAsResolved(reader) {
      defaultReaderClosedPromiseInitialize(reader)
      defaultReaderClosedPromiseResolve(reader)
    }
    function defaultReaderClosedPromiseReject(reader, reason) {
      if (reader._closedPromise_reject === undefined) {
        return
      }
      setPromiseIsHandledToTrue(reader._closedPromise)
      reader._closedPromise_reject(reason)
      reader._closedPromise_resolve = undefined
      reader._closedPromise_reject = undefined
    }
    function defaultReaderClosedPromiseResetToRejected(reader, reason) {
      defaultReaderClosedPromiseInitializeAsRejected(reader, reason)
    }
    function defaultReaderClosedPromiseResolve(reader) {
      if (reader._closedPromise_resolve === undefined) {
        return
      }
      reader._closedPromise_resolve(undefined)
      reader._closedPromise_resolve = undefined
      reader._closedPromise_reject = undefined
    }
    const NumberIsFinite = Number.isFinite || ((x) => typeof x === 'number' && Number.isFinite(x))
    const MathTrunc = Math.trunc || ((v) => (v < 0 ? Math.ceil(v) : Math.floor(v)))
    function isDictionary(x) {
      return typeof x === 'object' || typeof x === 'function'
    }
    function assertDictionary(obj, context) {
      if (obj !== undefined && !isDictionary(obj)) {
        throw new TypeError(`${context} is not an object.`)
      }
    }
    function assertFunction(x, context) {
      if (typeof x !== 'function') {
        throw new TypeError(`${context} is not a function.`)
      }
    }
    function isObject(x) {
      return (typeof x === 'object' && x !== null) || typeof x === 'function'
    }
    function assertObject(x, context) {
      if (!isObject(x)) {
        throw new TypeError(`${context} is not an object.`)
      }
    }
    function assertRequiredArgument(x, position, context) {
      if (x === undefined) {
        throw new TypeError(`Parameter ${position} is required in '${context}'.`)
      }
    }
    function assertRequiredField(x, field, context) {
      if (x === undefined) {
        throw new TypeError(`${field} is required in '${context}'.`)
      }
    }
    function convertUnrestrictedDouble(value) {
      return Number(value)
    }
    function censorNegativeZero(x) {
      return x === 0 ? 0 : x
    }
    function integerPart(x) {
      return censorNegativeZero(MathTrunc(x))
    }
    function convertUnsignedLongLongWithEnforceRange(value, context) {
      const lowerBound = 0
      const upperBound = Number.MAX_SAFE_INTEGER
      let x = Number(value)
      x = censorNegativeZero(x)
      if (!NumberIsFinite(x)) {
        throw new TypeError(`${context} is not a finite number`)
      }
      x = integerPart(x)
      if (x < lowerBound || x > upperBound) {
        throw new TypeError(
          `${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`,
        )
      }
      if (!NumberIsFinite(x) || x === 0) {
        return 0
      }
      return x
    }
    function assertReadableStream(x, context) {
      if (!IsReadableStream(x)) {
        throw new TypeError(`${context} is not a ReadableStream.`)
      }
    }
    function AcquireReadableStreamDefaultReader(stream) {
      return new ReadableStreamDefaultReader(stream)
    }
    function ReadableStreamAddReadRequest(stream, readRequest) {
      stream._reader._readRequests.push(readRequest)
    }
    function ReadableStreamFulfillReadRequest(stream, chunk, done) {
      const reader = stream._reader
      const readRequest = reader._readRequests.shift()
      if (done) {
        readRequest._closeSteps()
      } else {
        readRequest._chunkSteps(chunk)
      }
    }
    function ReadableStreamGetNumReadRequests(stream) {
      return stream._reader._readRequests.length
    }
    function ReadableStreamHasDefaultReader(stream) {
      const reader = stream._reader
      if (reader === undefined) {
        return false
      }
      if (!IsReadableStreamDefaultReader(reader)) {
        return false
      }
      return true
    }

    class ReadableStreamDefaultReader {
      constructor(stream) {
        assertRequiredArgument(stream, 1, 'ReadableStreamDefaultReader')
        assertReadableStream(stream, 'First parameter')
        if (IsReadableStreamLocked(stream)) {
          throw new TypeError(
            'This stream has already been locked for exclusive reading by another reader',
          )
        }
        ReadableStreamReaderGenericInitialize(this, stream)
        this._readRequests = new SimpleQueue()
      }
      get closed() {
        if (!IsReadableStreamDefaultReader(this)) {
          return promiseRejectedWith(defaultReaderBrandCheckException('closed'))
        }
        return this._closedPromise
      }
      cancel(reason = undefined) {
        if (!IsReadableStreamDefaultReader(this)) {
          return promiseRejectedWith(defaultReaderBrandCheckException('cancel'))
        }
        if (this._ownerReadableStream === undefined) {
          return promiseRejectedWith(readerLockException('cancel'))
        }
        return ReadableStreamReaderGenericCancel(this, reason)
      }
      read() {
        if (!IsReadableStreamDefaultReader(this)) {
          return promiseRejectedWith(defaultReaderBrandCheckException('read'))
        }
        if (this._ownerReadableStream === undefined) {
          return promiseRejectedWith(readerLockException('read from'))
        }
        let resolvePromise
        let rejectPromise
        const promise = newPromise((resolve, reject) => {
          resolvePromise = resolve
          rejectPromise = reject
        })
        const readRequest = {
          _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
          _closeSteps: () => resolvePromise({ value: undefined, done: true }),
          _errorSteps: (e) => rejectPromise(e),
        }
        ReadableStreamDefaultReaderRead(this, readRequest)
        return promise
      }
      releaseLock() {
        if (!IsReadableStreamDefaultReader(this)) {
          throw defaultReaderBrandCheckException('releaseLock')
        }
        if (this._ownerReadableStream === undefined) {
          return
        }
        ReadableStreamDefaultReaderRelease(this)
      }
    }
    Object.defineProperties(ReadableStreamDefaultReader.prototype, {
      cancel: { enumerable: true },
      read: { enumerable: true },
      releaseLock: { enumerable: true },
      closed: { enumerable: true },
    })
    setFunctionName(ReadableStreamDefaultReader.prototype.cancel, 'cancel')
    setFunctionName(ReadableStreamDefaultReader.prototype.read, 'read')
    setFunctionName(ReadableStreamDefaultReader.prototype.releaseLock, 'releaseLock')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(ReadableStreamDefaultReader.prototype, Symbol.toStringTag, {
        value: 'ReadableStreamDefaultReader',
        configurable: true,
      })
    }
    function IsReadableStreamDefaultReader(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_readRequests')) {
        return false
      }
      return x instanceof ReadableStreamDefaultReader
    }
    function ReadableStreamDefaultReaderRead(reader, readRequest) {
      const stream = reader._ownerReadableStream
      stream._disturbed = true
      if (stream._state === 'closed') {
        readRequest._closeSteps()
      } else if (stream._state === 'errored') {
        readRequest._errorSteps(stream._storedError)
      } else {
        stream._readableStreamController[PullSteps](readRequest)
      }
    }
    function ReadableStreamDefaultReaderRelease(reader) {
      ReadableStreamReaderGenericRelease(reader)
      const e = new TypeError('Reader was released')
      ReadableStreamDefaultReaderErrorReadRequests(reader, e)
    }
    function ReadableStreamDefaultReaderErrorReadRequests(reader, e) {
      const readRequests = reader._readRequests
      reader._readRequests = new SimpleQueue()
      readRequests.forEach((readRequest) => {
        readRequest._errorSteps(e)
      })
    }
    function defaultReaderBrandCheckException(name) {
      return new TypeError(
        `ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`,
      )
    }
    const AsyncIteratorPrototype = Object.getPrototypeOf(
      Object.getPrototypeOf(async function* () {}).prototype,
    )

    class ReadableStreamAsyncIteratorImpl {
      constructor(reader, preventCancel) {
        this._ongoingPromise = undefined
        this._isFinished = false
        this._reader = reader
        this._preventCancel = preventCancel
      }
      next() {
        const nextSteps = () => this._nextSteps()
        this._ongoingPromise = this._ongoingPromise
          ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps)
          : nextSteps()
        return this._ongoingPromise
      }
      return(value) {
        const returnSteps = () => this._returnSteps(value)
        return this._ongoingPromise
          ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps)
          : returnSteps()
      }
      _nextSteps() {
        if (this._isFinished) {
          return Promise.resolve({ value: undefined, done: true })
        }
        const reader = this._reader
        let resolvePromise
        let rejectPromise
        const promise = newPromise((resolve, reject) => {
          resolvePromise = resolve
          rejectPromise = reject
        })
        const readRequest = {
          _chunkSteps: (chunk) => {
            this._ongoingPromise = undefined
            _queueMicrotask(() => resolvePromise({ value: chunk, done: false }))
          },
          _closeSteps: () => {
            this._ongoingPromise = undefined
            this._isFinished = true
            ReadableStreamReaderGenericRelease(reader)
            resolvePromise({ value: undefined, done: true })
          },
          _errorSteps: (reason) => {
            this._ongoingPromise = undefined
            this._isFinished = true
            ReadableStreamReaderGenericRelease(reader)
            rejectPromise(reason)
          },
        }
        ReadableStreamDefaultReaderRead(reader, readRequest)
        return promise
      }
      _returnSteps(value) {
        if (this._isFinished) {
          return Promise.resolve({ value, done: true })
        }
        this._isFinished = true
        const reader = this._reader
        if (!this._preventCancel) {
          const result = ReadableStreamReaderGenericCancel(reader, value)
          ReadableStreamReaderGenericRelease(reader)
          return transformPromiseWith(result, () => ({ value, done: true }))
        }
        ReadableStreamReaderGenericRelease(reader)
        return promiseResolvedWith({ value, done: true })
      }
    }
    const ReadableStreamAsyncIteratorPrototype = {
      next() {
        if (!IsReadableStreamAsyncIterator(this)) {
          return promiseRejectedWith(streamAsyncIteratorBrandCheckException('next'))
        }
        return this._asyncIteratorImpl.next()
      },
      return(value) {
        if (!IsReadableStreamAsyncIterator(this)) {
          return promiseRejectedWith(streamAsyncIteratorBrandCheckException('return'))
        }
        return this._asyncIteratorImpl.return(value)
      },
    }
    Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype)
    function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
      const reader = AcquireReadableStreamDefaultReader(stream)
      const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel)
      const iterator = Object.create(ReadableStreamAsyncIteratorPrototype)
      iterator._asyncIteratorImpl = impl
      return iterator
    }
    function IsReadableStreamAsyncIterator(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_asyncIteratorImpl')) {
        return false
      }
      try {
        return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl
      } catch (_a2) {
        return false
      }
    }
    function streamAsyncIteratorBrandCheckException(name) {
      return new TypeError(
        `ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`,
      )
    }
    const NumberIsNaN = Number.isNaN || ((x) => x !== x)
    let _a
    let _b
    let _c
    function CreateArrayFromList(elements) {
      return elements.slice()
    }
    function CopyDataBlockBytes(dest, destOffset, src, srcOffset, n) {
      new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n), destOffset)
    }
    let TransferArrayBuffer = (O) => {
      if (typeof O.transfer === 'function') {
        TransferArrayBuffer = (buffer) => buffer.transfer()
      } else if (typeof structuredClone === 'function') {
        TransferArrayBuffer = (buffer) => structuredClone(buffer, { transfer: [buffer] })
      } else {
        TransferArrayBuffer = (buffer) => buffer
      }
      return TransferArrayBuffer(O)
    }
    let IsDetachedBuffer = (O) => {
      if (typeof O.detached === 'boolean') {
        IsDetachedBuffer = (buffer) => buffer.detached
      } else {
        IsDetachedBuffer = (buffer) => buffer.byteLength === 0
      }
      return IsDetachedBuffer(O)
    }
    function ArrayBufferSlice(buffer, begin, end) {
      if (buffer.slice) {
        return buffer.slice(begin, end)
      }
      const length = end - begin
      const slice = new ArrayBuffer(length)
      CopyDataBlockBytes(slice, 0, buffer, begin, length)
      return slice
    }
    function GetMethod(receiver, prop) {
      const func = receiver[prop]
      if (func === undefined || func === null) {
        return
      }
      if (typeof func !== 'function') {
        throw new TypeError(`${String(prop)} is not a function`)
      }
      return func
    }
    function CreateAsyncFromSyncIterator(syncIteratorRecord) {
      const syncIterable = {
        [Symbol.iterator]: () => syncIteratorRecord.iterator,
      }
      const asyncIterator = (async function* () {
        return yield* syncIterable
      })()
      const nextMethod = asyncIterator.next
      return { iterator: asyncIterator, nextMethod, done: false }
    }
    const SymbolAsyncIterator =
      (_c =
        (_a = Symbol.asyncIterator) !== null && _a !== undefined
          ? _a
          : (_b = Symbol.for) === null || _b === undefined
            ? undefined
            : _b.call(Symbol, 'Symbol.asyncIterator')) !== null && _c !== undefined
        ? _c
        : '@@asyncIterator'
    function GetIterator(obj, hint, method) {
      if (method === undefined) {
        if (hint === 'async') {
          method = GetMethod(obj, SymbolAsyncIterator)
          if (method === undefined) {
            const syncMethod = GetMethod(obj, Symbol.iterator)
            const syncIteratorRecord = GetIterator(obj, 'sync', syncMethod)
            return CreateAsyncFromSyncIterator(syncIteratorRecord)
          }
        } else {
          method = GetMethod(obj, Symbol.iterator)
        }
      }
      if (method === undefined) {
        throw new TypeError('The object is not iterable')
      }
      const iterator = reflectCall(method, obj, [])
      if (!typeIsObject(iterator)) {
        throw new TypeError('The iterator method must return an object')
      }
      const nextMethod = iterator.next
      return { iterator, nextMethod, done: false }
    }
    function IteratorNext(iteratorRecord) {
      const result = reflectCall(iteratorRecord.nextMethod, iteratorRecord.iterator, [])
      if (!typeIsObject(result)) {
        throw new TypeError('The iterator.next() method must return an object')
      }
      return result
    }
    function IteratorComplete(iterResult) {
      return Boolean(iterResult.done)
    }
    function IteratorValue(iterResult) {
      return iterResult.value
    }
    function IsNonNegativeNumber(v) {
      if (typeof v !== 'number') {
        return false
      }
      if (NumberIsNaN(v)) {
        return false
      }
      if (v < 0) {
        return false
      }
      return true
    }
    function CloneAsUint8Array(O) {
      const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength)
      return new Uint8Array(buffer)
    }
    function DequeueValue(container) {
      const pair = container._queue.shift()
      container._queueTotalSize -= pair.size
      if (container._queueTotalSize < 0) {
        container._queueTotalSize = 0
      }
      return pair.value
    }
    function EnqueueValueWithSize(container, value, size) {
      if (!IsNonNegativeNumber(size) || size === Number.POSITIVE_INFINITY) {
        throw new RangeError('Size must be a finite, non-NaN, non-negative number.')
      }
      container._queue.push({ value, size })
      container._queueTotalSize += size
    }
    function PeekQueueValue(container) {
      const pair = container._queue.peek()
      return pair.value
    }
    function ResetQueue(container) {
      container._queue = new SimpleQueue()
      container._queueTotalSize = 0
    }
    function isDataViewConstructor(ctor) {
      return ctor === DataView
    }
    function isDataView(view) {
      return isDataViewConstructor(view.constructor)
    }
    function arrayBufferViewElementSize(ctor) {
      if (isDataViewConstructor(ctor)) {
        return 1
      }
      return ctor.BYTES_PER_ELEMENT
    }

    class ReadableStreamBYOBRequest {
      constructor() {
        throw new TypeError('Illegal constructor')
      }
      get view() {
        if (!IsReadableStreamBYOBRequest(this)) {
          throw byobRequestBrandCheckException('view')
        }
        return this._view
      }
      respond(bytesWritten) {
        if (!IsReadableStreamBYOBRequest(this)) {
          throw byobRequestBrandCheckException('respond')
        }
        assertRequiredArgument(bytesWritten, 1, 'respond')
        bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, 'First parameter')
        if (this._associatedReadableByteStreamController === undefined) {
          throw new TypeError('This BYOB request has been invalidated')
        }
        if (IsDetachedBuffer(this._view.buffer)) {
          throw new TypeError(
            `The BYOB request's buffer has been detached and so cannot be used as a response`,
          )
        }
        ReadableByteStreamControllerRespond(
          this._associatedReadableByteStreamController,
          bytesWritten,
        )
      }
      respondWithNewView(view) {
        if (!IsReadableStreamBYOBRequest(this)) {
          throw byobRequestBrandCheckException('respondWithNewView')
        }
        assertRequiredArgument(view, 1, 'respondWithNewView')
        if (!ArrayBuffer.isView(view)) {
          throw new TypeError('You can only respond with array buffer views')
        }
        if (this._associatedReadableByteStreamController === undefined) {
          throw new TypeError('This BYOB request has been invalidated')
        }
        if (IsDetachedBuffer(view.buffer)) {
          throw new TypeError(
            "The given view's buffer has been detached and so cannot be used as a response",
          )
        }
        ReadableByteStreamControllerRespondWithNewView(
          this._associatedReadableByteStreamController,
          view,
        )
      }
    }
    Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
      respond: { enumerable: true },
      respondWithNewView: { enumerable: true },
      view: { enumerable: true },
    })
    setFunctionName(ReadableStreamBYOBRequest.prototype.respond, 'respond')
    setFunctionName(ReadableStreamBYOBRequest.prototype.respondWithNewView, 'respondWithNewView')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(ReadableStreamBYOBRequest.prototype, Symbol.toStringTag, {
        value: 'ReadableStreamBYOBRequest',
        configurable: true,
      })
    }

    class ReadableByteStreamController {
      constructor() {
        throw new TypeError('Illegal constructor')
      }
      get byobRequest() {
        if (!IsReadableByteStreamController(this)) {
          throw byteStreamControllerBrandCheckException('byobRequest')
        }
        return ReadableByteStreamControllerGetBYOBRequest(this)
      }
      get desiredSize() {
        if (!IsReadableByteStreamController(this)) {
          throw byteStreamControllerBrandCheckException('desiredSize')
        }
        return ReadableByteStreamControllerGetDesiredSize(this)
      }
      close() {
        if (!IsReadableByteStreamController(this)) {
          throw byteStreamControllerBrandCheckException('close')
        }
        if (this._closeRequested) {
          throw new TypeError('The stream has already been closed; do not close it again!')
        }
        const state = this._controlledReadableByteStream._state
        if (state !== 'readable') {
          throw new TypeError(
            `The stream (in ${state} state) is not in the readable state and cannot be closed`,
          )
        }
        ReadableByteStreamControllerClose(this)
      }
      enqueue(chunk) {
        if (!IsReadableByteStreamController(this)) {
          throw byteStreamControllerBrandCheckException('enqueue')
        }
        assertRequiredArgument(chunk, 1, 'enqueue')
        if (!ArrayBuffer.isView(chunk)) {
          throw new TypeError('chunk must be an array buffer view')
        }
        if (chunk.byteLength === 0) {
          throw new TypeError('chunk must have non-zero byteLength')
        }
        if (chunk.buffer.byteLength === 0) {
          throw new TypeError(`chunk's buffer must have non-zero byteLength`)
        }
        if (this._closeRequested) {
          throw new TypeError('stream is closed or draining')
        }
        const state = this._controlledReadableByteStream._state
        if (state !== 'readable') {
          throw new TypeError(
            `The stream (in ${state} state) is not in the readable state and cannot be enqueued to`,
          )
        }
        ReadableByteStreamControllerEnqueue(this, chunk)
      }
      error(e = undefined) {
        if (!IsReadableByteStreamController(this)) {
          throw byteStreamControllerBrandCheckException('error')
        }
        ReadableByteStreamControllerError(this, e)
      }
      [CancelSteps](reason) {
        ReadableByteStreamControllerClearPendingPullIntos(this)
        ResetQueue(this)
        const result = this._cancelAlgorithm(reason)
        ReadableByteStreamControllerClearAlgorithms(this)
        return result
      }
      [PullSteps](readRequest) {
        const stream = this._controlledReadableByteStream
        if (this._queueTotalSize > 0) {
          ReadableByteStreamControllerFillReadRequestFromQueue(this, readRequest)
          return
        }
        const autoAllocateChunkSize = this._autoAllocateChunkSize
        if (autoAllocateChunkSize !== undefined) {
          let buffer
          try {
            buffer = new ArrayBuffer(autoAllocateChunkSize)
          } catch (bufferE) {
            readRequest._errorSteps(bufferE)
            return
          }
          const pullIntoDescriptor = {
            buffer,
            bufferByteLength: autoAllocateChunkSize,
            byteOffset: 0,
            byteLength: autoAllocateChunkSize,
            bytesFilled: 0,
            minimumFill: 1,
            elementSize: 1,
            viewConstructor: Uint8Array,
            readerType: 'default',
          }
          this._pendingPullIntos.push(pullIntoDescriptor)
        }
        ReadableStreamAddReadRequest(stream, readRequest)
        ReadableByteStreamControllerCallPullIfNeeded(this)
      }
      [ReleaseSteps]() {
        if (this._pendingPullIntos.length > 0) {
          const firstPullInto = this._pendingPullIntos.peek()
          firstPullInto.readerType = 'none'
          this._pendingPullIntos = new SimpleQueue()
          this._pendingPullIntos.push(firstPullInto)
        }
      }
    }
    Object.defineProperties(ReadableByteStreamController.prototype, {
      close: { enumerable: true },
      enqueue: { enumerable: true },
      error: { enumerable: true },
      byobRequest: { enumerable: true },
      desiredSize: { enumerable: true },
    })
    setFunctionName(ReadableByteStreamController.prototype.close, 'close')
    setFunctionName(ReadableByteStreamController.prototype.enqueue, 'enqueue')
    setFunctionName(ReadableByteStreamController.prototype.error, 'error')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(ReadableByteStreamController.prototype, Symbol.toStringTag, {
        value: 'ReadableByteStreamController',
        configurable: true,
      })
    }
    function IsReadableByteStreamController(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_controlledReadableByteStream')) {
        return false
      }
      return x instanceof ReadableByteStreamController
    }
    function IsReadableStreamBYOBRequest(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_associatedReadableByteStreamController')) {
        return false
      }
      return x instanceof ReadableStreamBYOBRequest
    }
    function ReadableByteStreamControllerCallPullIfNeeded(controller) {
      const shouldPull = ReadableByteStreamControllerShouldCallPull(controller)
      if (!shouldPull) {
        return
      }
      if (controller._pulling) {
        controller._pullAgain = true
        return
      }
      controller._pulling = true
      const pullPromise = controller._pullAlgorithm()
      uponPromise(
        pullPromise,
        () => {
          controller._pulling = false
          if (controller._pullAgain) {
            controller._pullAgain = false
            ReadableByteStreamControllerCallPullIfNeeded(controller)
          }
          return null
        },
        (e) => {
          ReadableByteStreamControllerError(controller, e)
          return null
        },
      )
    }
    function ReadableByteStreamControllerClearPendingPullIntos(controller) {
      ReadableByteStreamControllerInvalidateBYOBRequest(controller)
      controller._pendingPullIntos = new SimpleQueue()
    }
    function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
      let done = false
      if (stream._state === 'closed') {
        done = true
      }
      const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor)
      if (pullIntoDescriptor.readerType === 'default') {
        ReadableStreamFulfillReadRequest(stream, filledView, done)
      } else {
        ReadableStreamFulfillReadIntoRequest(stream, filledView, done)
      }
    }
    function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
      const bytesFilled = pullIntoDescriptor.bytesFilled
      const elementSize = pullIntoDescriptor.elementSize
      return new pullIntoDescriptor.viewConstructor(
        pullIntoDescriptor.buffer,
        pullIntoDescriptor.byteOffset,
        bytesFilled / elementSize,
      )
    }
    function ReadableByteStreamControllerEnqueueChunkToQueue(
      controller,
      buffer,
      byteOffset,
      byteLength,
    ) {
      controller._queue.push({ buffer, byteOffset, byteLength })
      controller._queueTotalSize += byteLength
    }
    function ReadableByteStreamControllerEnqueueClonedChunkToQueue(
      controller,
      buffer,
      byteOffset,
      byteLength,
    ) {
      let clonedChunk
      try {
        clonedChunk = ArrayBufferSlice(buffer, byteOffset, byteOffset + byteLength)
      } catch (cloneE) {
        ReadableByteStreamControllerError(controller, cloneE)
        throw cloneE
      }
      ReadableByteStreamControllerEnqueueChunkToQueue(controller, clonedChunk, 0, byteLength)
    }
    function ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue(
      controller,
      firstDescriptor,
    ) {
      if (firstDescriptor.bytesFilled > 0) {
        ReadableByteStreamControllerEnqueueClonedChunkToQueue(
          controller,
          firstDescriptor.buffer,
          firstDescriptor.byteOffset,
          firstDescriptor.bytesFilled,
        )
      }
      ReadableByteStreamControllerShiftPendingPullInto(controller)
    }
    function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
      controller,
      pullIntoDescriptor,
    ) {
      const maxBytesToCopy = Math.min(
        controller._queueTotalSize,
        pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled,
      )
      const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy
      let totalBytesToCopyRemaining = maxBytesToCopy
      let ready = false
      const remainderBytes = maxBytesFilled % pullIntoDescriptor.elementSize
      const maxAlignedBytes = maxBytesFilled - remainderBytes
      if (maxAlignedBytes >= pullIntoDescriptor.minimumFill) {
        totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled
        ready = true
      }
      const queue = controller._queue
      while (totalBytesToCopyRemaining > 0) {
        const headOfQueue = queue.peek()
        const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength)
        const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled
        CopyDataBlockBytes(
          pullIntoDescriptor.buffer,
          destStart,
          headOfQueue.buffer,
          headOfQueue.byteOffset,
          bytesToCopy,
        )
        if (headOfQueue.byteLength === bytesToCopy) {
          queue.shift()
        } else {
          headOfQueue.byteOffset += bytesToCopy
          headOfQueue.byteLength -= bytesToCopy
        }
        controller._queueTotalSize -= bytesToCopy
        ReadableByteStreamControllerFillHeadPullIntoDescriptor(
          controller,
          bytesToCopy,
          pullIntoDescriptor,
        )
        totalBytesToCopyRemaining -= bytesToCopy
      }
      return ready
    }
    function ReadableByteStreamControllerFillHeadPullIntoDescriptor(
      _controller,
      size,
      pullIntoDescriptor,
    ) {
      pullIntoDescriptor.bytesFilled += size
    }
    function ReadableByteStreamControllerHandleQueueDrain(controller) {
      if (controller._queueTotalSize === 0 && controller._closeRequested) {
        ReadableByteStreamControllerClearAlgorithms(controller)
        ReadableStreamClose(controller._controlledReadableByteStream)
      } else {
        ReadableByteStreamControllerCallPullIfNeeded(controller)
      }
    }
    function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
      if (controller._byobRequest === null) {
        return
      }
      controller._byobRequest._associatedReadableByteStreamController = undefined
      controller._byobRequest._view = null
      controller._byobRequest = null
    }
    function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
      while (controller._pendingPullIntos.length > 0) {
        if (controller._queueTotalSize === 0) {
          return
        }
        const pullIntoDescriptor = controller._pendingPullIntos.peek()
        if (
          ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
            controller,
            pullIntoDescriptor,
          )
        ) {
          ReadableByteStreamControllerShiftPendingPullInto(controller)
          ReadableByteStreamControllerCommitPullIntoDescriptor(
            controller._controlledReadableByteStream,
            pullIntoDescriptor,
          )
        }
      }
    }
    function ReadableByteStreamControllerProcessReadRequestsUsingQueue(controller) {
      const reader = controller._controlledReadableByteStream._reader
      while (reader._readRequests.length > 0) {
        if (controller._queueTotalSize === 0) {
          return
        }
        const readRequest = reader._readRequests.shift()
        ReadableByteStreamControllerFillReadRequestFromQueue(controller, readRequest)
      }
    }
    function ReadableByteStreamControllerPullInto(controller, view, min, readIntoRequest) {
      const stream = controller._controlledReadableByteStream
      const ctor = view.constructor
      const elementSize = arrayBufferViewElementSize(ctor)
      const { byteOffset, byteLength } = view
      const minimumFill = min * elementSize
      let buffer
      try {
        buffer = TransferArrayBuffer(view.buffer)
      } catch (e) {
        readIntoRequest._errorSteps(e)
        return
      }
      const pullIntoDescriptor = {
        buffer,
        bufferByteLength: buffer.byteLength,
        byteOffset,
        byteLength,
        bytesFilled: 0,
        minimumFill,
        elementSize,
        viewConstructor: ctor,
        readerType: 'byob',
      }
      if (controller._pendingPullIntos.length > 0) {
        controller._pendingPullIntos.push(pullIntoDescriptor)
        ReadableStreamAddReadIntoRequest(stream, readIntoRequest)
        return
      }
      if (stream._state === 'closed') {
        const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0)
        readIntoRequest._closeSteps(emptyView)
        return
      }
      if (controller._queueTotalSize > 0) {
        if (
          ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(
            controller,
            pullIntoDescriptor,
          )
        ) {
          const filledView =
            ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor)
          ReadableByteStreamControllerHandleQueueDrain(controller)
          readIntoRequest._chunkSteps(filledView)
          return
        }
        if (controller._closeRequested) {
          const e = new TypeError('Insufficient bytes to fill elements in the given buffer')
          ReadableByteStreamControllerError(controller, e)
          readIntoRequest._errorSteps(e)
          return
        }
      }
      controller._pendingPullIntos.push(pullIntoDescriptor)
      ReadableStreamAddReadIntoRequest(stream, readIntoRequest)
      ReadableByteStreamControllerCallPullIfNeeded(controller)
    }
    function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
      if (firstDescriptor.readerType === 'none') {
        ReadableByteStreamControllerShiftPendingPullInto(controller)
      }
      const stream = controller._controlledReadableByteStream
      if (ReadableStreamHasBYOBReader(stream)) {
        while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
          const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller)
          ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor)
        }
      }
    }
    function ReadableByteStreamControllerRespondInReadableState(
      controller,
      bytesWritten,
      pullIntoDescriptor,
    ) {
      ReadableByteStreamControllerFillHeadPullIntoDescriptor(
        controller,
        bytesWritten,
        pullIntoDescriptor,
      )
      if (pullIntoDescriptor.readerType === 'none') {
        ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue(controller, pullIntoDescriptor)
        ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller)
        return
      }
      if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.minimumFill) {
        return
      }
      ReadableByteStreamControllerShiftPendingPullInto(controller)
      const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize
      if (remainderSize > 0) {
        const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled
        ReadableByteStreamControllerEnqueueClonedChunkToQueue(
          controller,
          pullIntoDescriptor.buffer,
          end - remainderSize,
          remainderSize,
        )
      }
      pullIntoDescriptor.bytesFilled -= remainderSize
      ReadableByteStreamControllerCommitPullIntoDescriptor(
        controller._controlledReadableByteStream,
        pullIntoDescriptor,
      )
      ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller)
    }
    function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
      const firstDescriptor = controller._pendingPullIntos.peek()
      ReadableByteStreamControllerInvalidateBYOBRequest(controller)
      const state = controller._controlledReadableByteStream._state
      if (state === 'closed') {
        ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor)
      } else {
        ReadableByteStreamControllerRespondInReadableState(
          controller,
          bytesWritten,
          firstDescriptor,
        )
      }
      ReadableByteStreamControllerCallPullIfNeeded(controller)
    }
    function ReadableByteStreamControllerShiftPendingPullInto(controller) {
      const descriptor = controller._pendingPullIntos.shift()
      return descriptor
    }
    function ReadableByteStreamControllerShouldCallPull(controller) {
      const stream = controller._controlledReadableByteStream
      if (stream._state !== 'readable') {
        return false
      }
      if (controller._closeRequested) {
        return false
      }
      if (!controller._started) {
        return false
      }
      if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
        return true
      }
      if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
        return true
      }
      const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller)
      if (desiredSize > 0) {
        return true
      }
      return false
    }
    function ReadableByteStreamControllerClearAlgorithms(controller) {
      controller._pullAlgorithm = undefined
      controller._cancelAlgorithm = undefined
    }
    function ReadableByteStreamControllerClose(controller) {
      const stream = controller._controlledReadableByteStream
      if (controller._closeRequested || stream._state !== 'readable') {
        return
      }
      if (controller._queueTotalSize > 0) {
        controller._closeRequested = true
        return
      }
      if (controller._pendingPullIntos.length > 0) {
        const firstPendingPullInto = controller._pendingPullIntos.peek()
        if (firstPendingPullInto.bytesFilled % firstPendingPullInto.elementSize !== 0) {
          const e = new TypeError('Insufficient bytes to fill elements in the given buffer')
          ReadableByteStreamControllerError(controller, e)
          throw e
        }
      }
      ReadableByteStreamControllerClearAlgorithms(controller)
      ReadableStreamClose(stream)
    }
    function ReadableByteStreamControllerEnqueue(controller, chunk) {
      const stream = controller._controlledReadableByteStream
      if (controller._closeRequested || stream._state !== 'readable') {
        return
      }
      const { buffer, byteOffset, byteLength } = chunk
      if (IsDetachedBuffer(buffer)) {
        throw new TypeError("chunk's buffer is detached and so cannot be enqueued")
      }
      const transferredBuffer = TransferArrayBuffer(buffer)
      if (controller._pendingPullIntos.length > 0) {
        const firstPendingPullInto = controller._pendingPullIntos.peek()
        if (IsDetachedBuffer(firstPendingPullInto.buffer)) {
          throw new TypeError(
            "The BYOB request's buffer has been detached and so cannot be filled with an enqueued chunk",
          )
        }
        ReadableByteStreamControllerInvalidateBYOBRequest(controller)
        firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer)
        if (firstPendingPullInto.readerType === 'none') {
          ReadableByteStreamControllerEnqueueDetachedPullIntoToQueue(
            controller,
            firstPendingPullInto,
          )
        }
      }
      if (ReadableStreamHasDefaultReader(stream)) {
        ReadableByteStreamControllerProcessReadRequestsUsingQueue(controller)
        if (ReadableStreamGetNumReadRequests(stream) === 0) {
          ReadableByteStreamControllerEnqueueChunkToQueue(
            controller,
            transferredBuffer,
            byteOffset,
            byteLength,
          )
        } else {
          if (controller._pendingPullIntos.length > 0) {
            ReadableByteStreamControllerShiftPendingPullInto(controller)
          }
          const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength)
          ReadableStreamFulfillReadRequest(stream, transferredView, false)
        }
      } else if (ReadableStreamHasBYOBReader(stream)) {
        ReadableByteStreamControllerEnqueueChunkToQueue(
          controller,
          transferredBuffer,
          byteOffset,
          byteLength,
        )
        ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller)
      } else {
        ReadableByteStreamControllerEnqueueChunkToQueue(
          controller,
          transferredBuffer,
          byteOffset,
          byteLength,
        )
      }
      ReadableByteStreamControllerCallPullIfNeeded(controller)
    }
    function ReadableByteStreamControllerError(controller, e) {
      const stream = controller._controlledReadableByteStream
      if (stream._state !== 'readable') {
        return
      }
      ReadableByteStreamControllerClearPendingPullIntos(controller)
      ResetQueue(controller)
      ReadableByteStreamControllerClearAlgorithms(controller)
      ReadableStreamError(stream, e)
    }
    function ReadableByteStreamControllerFillReadRequestFromQueue(controller, readRequest) {
      const entry = controller._queue.shift()
      controller._queueTotalSize -= entry.byteLength
      ReadableByteStreamControllerHandleQueueDrain(controller)
      const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength)
      readRequest._chunkSteps(view)
    }
    function ReadableByteStreamControllerGetBYOBRequest(controller) {
      if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
        const firstDescriptor = controller._pendingPullIntos.peek()
        const view = new Uint8Array(
          firstDescriptor.buffer,
          firstDescriptor.byteOffset + firstDescriptor.bytesFilled,
          firstDescriptor.byteLength - firstDescriptor.bytesFilled,
        )
        const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype)
        SetUpReadableStreamBYOBRequest(byobRequest, controller, view)
        controller._byobRequest = byobRequest
      }
      return controller._byobRequest
    }
    function ReadableByteStreamControllerGetDesiredSize(controller) {
      const state = controller._controlledReadableByteStream._state
      if (state === 'errored') {
        return null
      }
      if (state === 'closed') {
        return 0
      }
      return controller._strategyHWM - controller._queueTotalSize
    }
    function ReadableByteStreamControllerRespond(controller, bytesWritten) {
      const firstDescriptor = controller._pendingPullIntos.peek()
      const state = controller._controlledReadableByteStream._state
      if (state === 'closed') {
        if (bytesWritten !== 0) {
          throw new TypeError('bytesWritten must be 0 when calling respond() on a closed stream')
        }
      } else {
        if (bytesWritten === 0) {
          throw new TypeError(
            'bytesWritten must be greater than 0 when calling respond() on a readable stream',
          )
        }
        if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
          throw new RangeError('bytesWritten out of range')
        }
      }
      firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer)
      ReadableByteStreamControllerRespondInternal(controller, bytesWritten)
    }
    function ReadableByteStreamControllerRespondWithNewView(controller, view) {
      const firstDescriptor = controller._pendingPullIntos.peek()
      const state = controller._controlledReadableByteStream._state
      if (state === 'closed') {
        if (view.byteLength !== 0) {
          throw new TypeError(
            "The view's length must be 0 when calling respondWithNewView() on a closed stream",
          )
        }
      } else if (view.byteLength === 0) {
        throw new TypeError(
          "The view's length must be greater than 0 when calling respondWithNewView() on a readable stream",
        )
      }
      if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
        throw new RangeError('The region specified by view does not match byobRequest')
      }
      if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
        throw new RangeError('The buffer of view has different capacity than byobRequest')
      }
      if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
        throw new RangeError('The region specified by view is larger than byobRequest')
      }
      const viewByteLength = view.byteLength
      firstDescriptor.buffer = TransferArrayBuffer(view.buffer)
      ReadableByteStreamControllerRespondInternal(controller, viewByteLength)
    }
    function SetUpReadableByteStreamController(
      stream,
      controller,
      startAlgorithm,
      pullAlgorithm,
      cancelAlgorithm,
      highWaterMark,
      autoAllocateChunkSize,
    ) {
      controller._controlledReadableByteStream = stream
      controller._pullAgain = false
      controller._pulling = false
      controller._byobRequest = null
      controller._queue = controller._queueTotalSize = undefined
      ResetQueue(controller)
      controller._closeRequested = false
      controller._started = false
      controller._strategyHWM = highWaterMark
      controller._pullAlgorithm = pullAlgorithm
      controller._cancelAlgorithm = cancelAlgorithm
      controller._autoAllocateChunkSize = autoAllocateChunkSize
      controller._pendingPullIntos = new SimpleQueue()
      stream._readableStreamController = controller
      const startResult = startAlgorithm()
      uponPromise(
        promiseResolvedWith(startResult),
        () => {
          controller._started = true
          ReadableByteStreamControllerCallPullIfNeeded(controller)
          return null
        },
        (r) => {
          ReadableByteStreamControllerError(controller, r)
          return null
        },
      )
    }
    function SetUpReadableByteStreamControllerFromUnderlyingSource(
      stream,
      underlyingByteSource,
      highWaterMark,
    ) {
      const controller = Object.create(ReadableByteStreamController.prototype)
      let startAlgorithm
      let pullAlgorithm
      let cancelAlgorithm
      if (underlyingByteSource.start !== undefined) {
        startAlgorithm = () => underlyingByteSource.start(controller)
      } else {
        startAlgorithm = () => {
          return
        }
      }
      if (underlyingByteSource.pull !== undefined) {
        pullAlgorithm = () => underlyingByteSource.pull(controller)
      } else {
        pullAlgorithm = () => promiseResolvedWith(undefined)
      }
      if (underlyingByteSource.cancel !== undefined) {
        cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason)
      } else {
        cancelAlgorithm = () => promiseResolvedWith(undefined)
      }
      const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize
      if (autoAllocateChunkSize === 0) {
        throw new TypeError('autoAllocateChunkSize must be greater than 0')
      }
      SetUpReadableByteStreamController(
        stream,
        controller,
        startAlgorithm,
        pullAlgorithm,
        cancelAlgorithm,
        highWaterMark,
        autoAllocateChunkSize,
      )
    }
    function SetUpReadableStreamBYOBRequest(request, controller, view) {
      request._associatedReadableByteStreamController = controller
      request._view = view
    }
    function byobRequestBrandCheckException(name) {
      return new TypeError(
        `ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`,
      )
    }
    function byteStreamControllerBrandCheckException(name) {
      return new TypeError(
        `ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`,
      )
    }
    function convertReaderOptions(options, context) {
      assertDictionary(options, context)
      const mode = options === null || options === undefined ? undefined : options.mode
      return {
        mode:
          mode === undefined
            ? undefined
            : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`),
      }
    }
    function convertReadableStreamReaderMode(mode, context) {
      mode = `${mode}`
      if (mode !== 'byob') {
        throw new TypeError(
          `${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`,
        )
      }
      return mode
    }
    function convertByobReadOptions(options, context) {
      let _a2
      assertDictionary(options, context)
      const min =
        (_a2 = options === null || options === undefined ? undefined : options.min) !== null &&
        _a2 !== undefined
          ? _a2
          : 1
      return {
        min: convertUnsignedLongLongWithEnforceRange(min, `${context} has member 'min' that`),
      }
    }
    function AcquireReadableStreamBYOBReader(stream) {
      return new ReadableStreamBYOBReader(stream)
    }
    function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
      stream._reader._readIntoRequests.push(readIntoRequest)
    }
    function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
      const reader = stream._reader
      const readIntoRequest = reader._readIntoRequests.shift()
      if (done) {
        readIntoRequest._closeSteps(chunk)
      } else {
        readIntoRequest._chunkSteps(chunk)
      }
    }
    function ReadableStreamGetNumReadIntoRequests(stream) {
      return stream._reader._readIntoRequests.length
    }
    function ReadableStreamHasBYOBReader(stream) {
      const reader = stream._reader
      if (reader === undefined) {
        return false
      }
      if (!IsReadableStreamBYOBReader(reader)) {
        return false
      }
      return true
    }

    class ReadableStreamBYOBReader {
      constructor(stream) {
        assertRequiredArgument(stream, 1, 'ReadableStreamBYOBReader')
        assertReadableStream(stream, 'First parameter')
        if (IsReadableStreamLocked(stream)) {
          throw new TypeError(
            'This stream has already been locked for exclusive reading by another reader',
          )
        }
        if (!IsReadableByteStreamController(stream._readableStreamController)) {
          throw new TypeError(
            'Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte ' +
              'source',
          )
        }
        ReadableStreamReaderGenericInitialize(this, stream)
        this._readIntoRequests = new SimpleQueue()
      }
      get closed() {
        if (!IsReadableStreamBYOBReader(this)) {
          return promiseRejectedWith(byobReaderBrandCheckException('closed'))
        }
        return this._closedPromise
      }
      cancel(reason = undefined) {
        if (!IsReadableStreamBYOBReader(this)) {
          return promiseRejectedWith(byobReaderBrandCheckException('cancel'))
        }
        if (this._ownerReadableStream === undefined) {
          return promiseRejectedWith(readerLockException('cancel'))
        }
        return ReadableStreamReaderGenericCancel(this, reason)
      }
      read(view, rawOptions = {}) {
        if (!IsReadableStreamBYOBReader(this)) {
          return promiseRejectedWith(byobReaderBrandCheckException('read'))
        }
        if (!ArrayBuffer.isView(view)) {
          return promiseRejectedWith(new TypeError('view must be an array buffer view'))
        }
        if (view.byteLength === 0) {
          return promiseRejectedWith(new TypeError('view must have non-zero byteLength'))
        }
        if (view.buffer.byteLength === 0) {
          return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`))
        }
        if (IsDetachedBuffer(view.buffer)) {
          return promiseRejectedWith(new TypeError("view's buffer has been detached"))
        }
        let options
        try {
          options = convertByobReadOptions(rawOptions, 'options')
        } catch (e) {
          return promiseRejectedWith(e)
        }
        const min = options.min
        if (min === 0) {
          return promiseRejectedWith(new TypeError('options.min must be greater than 0'))
        }
        if (!isDataView(view)) {
          if (min > view.length) {
            return promiseRejectedWith(
              new RangeError("options.min must be less than or equal to view's length"),
            )
          }
        } else if (min > view.byteLength) {
          return promiseRejectedWith(
            new RangeError("options.min must be less than or equal to view's byteLength"),
          )
        }
        if (this._ownerReadableStream === undefined) {
          return promiseRejectedWith(readerLockException('read from'))
        }
        let resolvePromise
        let rejectPromise
        const promise = newPromise((resolve, reject) => {
          resolvePromise = resolve
          rejectPromise = reject
        })
        const readIntoRequest = {
          _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
          _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
          _errorSteps: (e) => rejectPromise(e),
        }
        ReadableStreamBYOBReaderRead(this, view, min, readIntoRequest)
        return promise
      }
      releaseLock() {
        if (!IsReadableStreamBYOBReader(this)) {
          throw byobReaderBrandCheckException('releaseLock')
        }
        if (this._ownerReadableStream === undefined) {
          return
        }
        ReadableStreamBYOBReaderRelease(this)
      }
    }
    Object.defineProperties(ReadableStreamBYOBReader.prototype, {
      cancel: { enumerable: true },
      read: { enumerable: true },
      releaseLock: { enumerable: true },
      closed: { enumerable: true },
    })
    setFunctionName(ReadableStreamBYOBReader.prototype.cancel, 'cancel')
    setFunctionName(ReadableStreamBYOBReader.prototype.read, 'read')
    setFunctionName(ReadableStreamBYOBReader.prototype.releaseLock, 'releaseLock')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(ReadableStreamBYOBReader.prototype, Symbol.toStringTag, {
        value: 'ReadableStreamBYOBReader',
        configurable: true,
      })
    }
    function IsReadableStreamBYOBReader(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_readIntoRequests')) {
        return false
      }
      return x instanceof ReadableStreamBYOBReader
    }
    function ReadableStreamBYOBReaderRead(reader, view, min, readIntoRequest) {
      const stream = reader._ownerReadableStream
      stream._disturbed = true
      if (stream._state === 'errored') {
        readIntoRequest._errorSteps(stream._storedError)
      } else {
        ReadableByteStreamControllerPullInto(
          stream._readableStreamController,
          view,
          min,
          readIntoRequest,
        )
      }
    }
    function ReadableStreamBYOBReaderRelease(reader) {
      ReadableStreamReaderGenericRelease(reader)
      const e = new TypeError('Reader was released')
      ReadableStreamBYOBReaderErrorReadIntoRequests(reader, e)
    }
    function ReadableStreamBYOBReaderErrorReadIntoRequests(reader, e) {
      const readIntoRequests = reader._readIntoRequests
      reader._readIntoRequests = new SimpleQueue()
      readIntoRequests.forEach((readIntoRequest) => {
        readIntoRequest._errorSteps(e)
      })
    }
    function byobReaderBrandCheckException(name) {
      return new TypeError(
        `ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`,
      )
    }
    function ExtractHighWaterMark(strategy, defaultHWM) {
      const { highWaterMark } = strategy
      if (highWaterMark === undefined) {
        return defaultHWM
      }
      if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
        throw new RangeError('Invalid highWaterMark')
      }
      return highWaterMark
    }
    function ExtractSizeAlgorithm(strategy) {
      const { size } = strategy
      if (!size) {
        return () => 1
      }
      return size
    }
    function convertQueuingStrategy(init, context) {
      assertDictionary(init, context)
      const highWaterMark = init === null || init === undefined ? undefined : init.highWaterMark
      const size = init === null || init === undefined ? undefined : init.size
      return {
        highWaterMark:
          highWaterMark === undefined ? undefined : convertUnrestrictedDouble(highWaterMark),
        size:
          size === undefined
            ? undefined
            : convertQueuingStrategySize(size, `${context} has member 'size' that`),
      }
    }
    function convertQueuingStrategySize(fn, context) {
      assertFunction(fn, context)
      return (chunk) => convertUnrestrictedDouble(fn(chunk))
    }
    function convertUnderlyingSink(original, context) {
      assertDictionary(original, context)
      const abort = original === null || original === undefined ? undefined : original.abort
      const close = original === null || original === undefined ? undefined : original.close
      const start = original === null || original === undefined ? undefined : original.start
      const type = original === null || original === undefined ? undefined : original.type
      const write = original === null || original === undefined ? undefined : original.write
      return {
        abort:
          abort === undefined
            ? undefined
            : convertUnderlyingSinkAbortCallback(
                abort,
                original,
                `${context} has member 'abort' that`,
              ),
        close:
          close === undefined
            ? undefined
            : convertUnderlyingSinkCloseCallback(
                close,
                original,
                `${context} has member 'close' that`,
              ),
        start:
          start === undefined
            ? undefined
            : convertUnderlyingSinkStartCallback(
                start,
                original,
                `${context} has member 'start' that`,
              ),
        write:
          write === undefined
            ? undefined
            : convertUnderlyingSinkWriteCallback(
                write,
                original,
                `${context} has member 'write' that`,
              ),
        type,
      }
    }
    function convertUnderlyingSinkAbortCallback(fn, original, context) {
      assertFunction(fn, context)
      return (reason) => promiseCall(fn, original, [reason])
    }
    function convertUnderlyingSinkCloseCallback(fn, original, context) {
      assertFunction(fn, context)
      return () => promiseCall(fn, original, [])
    }
    function convertUnderlyingSinkStartCallback(fn, original, context) {
      assertFunction(fn, context)
      return (controller) => reflectCall(fn, original, [controller])
    }
    function convertUnderlyingSinkWriteCallback(fn, original, context) {
      assertFunction(fn, context)
      return (chunk, controller) => promiseCall(fn, original, [chunk, controller])
    }
    function assertWritableStream(x, context) {
      if (!IsWritableStream(x)) {
        throw new TypeError(`${context} is not a WritableStream.`)
      }
    }
    function isAbortSignal(value) {
      if (typeof value !== 'object' || value === null) {
        return false
      }
      try {
        return typeof value.aborted === 'boolean'
      } catch (_a2) {
        return false
      }
    }
    const supportsAbortController = typeof AbortController === 'function'
    function createAbortController() {
      if (supportsAbortController) {
        return new AbortController()
      }
      return
    }

    class WritableStream {
      constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
        if (rawUnderlyingSink === undefined) {
          rawUnderlyingSink = null
        } else {
          assertObject(rawUnderlyingSink, 'First parameter')
        }
        const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter')
        const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, 'First parameter')
        InitializeWritableStream(this)
        const type = underlyingSink.type
        if (type !== undefined) {
          throw new RangeError('Invalid type is specified')
        }
        const sizeAlgorithm = ExtractSizeAlgorithm(strategy)
        const highWaterMark = ExtractHighWaterMark(strategy, 1)
        SetUpWritableStreamDefaultControllerFromUnderlyingSink(
          this,
          underlyingSink,
          highWaterMark,
          sizeAlgorithm,
        )
      }
      get locked() {
        if (!IsWritableStream(this)) {
          throw streamBrandCheckException$2('locked')
        }
        return IsWritableStreamLocked(this)
      }
      abort(reason = undefined) {
        if (!IsWritableStream(this)) {
          return promiseRejectedWith(streamBrandCheckException$2('abort'))
        }
        if (IsWritableStreamLocked(this)) {
          return promiseRejectedWith(
            new TypeError('Cannot abort a stream that already has a writer'),
          )
        }
        return WritableStreamAbort(this, reason)
      }
      close() {
        if (!IsWritableStream(this)) {
          return promiseRejectedWith(streamBrandCheckException$2('close'))
        }
        if (IsWritableStreamLocked(this)) {
          return promiseRejectedWith(
            new TypeError('Cannot close a stream that already has a writer'),
          )
        }
        if (WritableStreamCloseQueuedOrInFlight(this)) {
          return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'))
        }
        return WritableStreamClose(this)
      }
      getWriter() {
        if (!IsWritableStream(this)) {
          throw streamBrandCheckException$2('getWriter')
        }
        return AcquireWritableStreamDefaultWriter(this)
      }
    }
    Object.defineProperties(WritableStream.prototype, {
      abort: { enumerable: true },
      close: { enumerable: true },
      getWriter: { enumerable: true },
      locked: { enumerable: true },
    })
    setFunctionName(WritableStream.prototype.abort, 'abort')
    setFunctionName(WritableStream.prototype.close, 'close')
    setFunctionName(WritableStream.prototype.getWriter, 'getWriter')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(WritableStream.prototype, Symbol.toStringTag, {
        value: 'WritableStream',
        configurable: true,
      })
    }
    function AcquireWritableStreamDefaultWriter(stream) {
      return new WritableStreamDefaultWriter(stream)
    }
    function CreateWritableStream(
      startAlgorithm,
      writeAlgorithm,
      closeAlgorithm,
      abortAlgorithm,
      highWaterMark = 1,
      sizeAlgorithm = () => 1,
    ) {
      const stream = Object.create(WritableStream.prototype)
      InitializeWritableStream(stream)
      const controller = Object.create(WritableStreamDefaultController.prototype)
      SetUpWritableStreamDefaultController(
        stream,
        controller,
        startAlgorithm,
        writeAlgorithm,
        closeAlgorithm,
        abortAlgorithm,
        highWaterMark,
        sizeAlgorithm,
      )
      return stream
    }
    function InitializeWritableStream(stream) {
      stream._state = 'writable'
      stream._storedError = undefined
      stream._writer = undefined
      stream._writableStreamController = undefined
      stream._writeRequests = new SimpleQueue()
      stream._inFlightWriteRequest = undefined
      stream._closeRequest = undefined
      stream._inFlightCloseRequest = undefined
      stream._pendingAbortRequest = undefined
      stream._backpressure = false
    }
    function IsWritableStream(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_writableStreamController')) {
        return false
      }
      return x instanceof WritableStream
    }
    function IsWritableStreamLocked(stream) {
      if (stream._writer === undefined) {
        return false
      }
      return true
    }
    function WritableStreamAbort(stream, reason) {
      let _a2
      if (stream._state === 'closed' || stream._state === 'errored') {
        return promiseResolvedWith(undefined)
      }
      stream._writableStreamController._abortReason = reason
      ;(_a2 = stream._writableStreamController._abortController) === null ||
        _a2 === undefined ||
        _a2.abort(reason)
      const state = stream._state
      if (state === 'closed' || state === 'errored') {
        return promiseResolvedWith(undefined)
      }
      if (stream._pendingAbortRequest !== undefined) {
        return stream._pendingAbortRequest._promise
      }
      let wasAlreadyErroring = false
      if (state === 'erroring') {
        wasAlreadyErroring = true
        reason = undefined
      }
      const promise = newPromise((resolve, reject) => {
        stream._pendingAbortRequest = {
          _promise: undefined,
          _resolve: resolve,
          _reject: reject,
          _reason: reason,
          _wasAlreadyErroring: wasAlreadyErroring,
        }
      })
      stream._pendingAbortRequest._promise = promise
      if (!wasAlreadyErroring) {
        WritableStreamStartErroring(stream, reason)
      }
      return promise
    }
    function WritableStreamClose(stream) {
      const state = stream._state
      if (state === 'closed' || state === 'errored') {
        return promiseRejectedWith(
          new TypeError(
            `The stream (in ${state} state) is not in the writable state and cannot be closed`,
          ),
        )
      }
      const promise = newPromise((resolve, reject) => {
        const closeRequest = {
          _resolve: resolve,
          _reject: reject,
        }
        stream._closeRequest = closeRequest
      })
      const writer = stream._writer
      if (writer !== undefined && stream._backpressure && state === 'writable') {
        defaultWriterReadyPromiseResolve(writer)
      }
      WritableStreamDefaultControllerClose(stream._writableStreamController)
      return promise
    }
    function WritableStreamAddWriteRequest(stream) {
      const promise = newPromise((resolve, reject) => {
        const writeRequest = {
          _resolve: resolve,
          _reject: reject,
        }
        stream._writeRequests.push(writeRequest)
      })
      return promise
    }
    function WritableStreamDealWithRejection(stream, error) {
      const state = stream._state
      if (state === 'writable') {
        WritableStreamStartErroring(stream, error)
        return
      }
      WritableStreamFinishErroring(stream)
    }
    function WritableStreamStartErroring(stream, reason) {
      const controller = stream._writableStreamController
      stream._state = 'erroring'
      stream._storedError = reason
      const writer = stream._writer
      if (writer !== undefined) {
        WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason)
      }
      if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
        WritableStreamFinishErroring(stream)
      }
    }
    function WritableStreamFinishErroring(stream) {
      stream._state = 'errored'
      stream._writableStreamController[ErrorSteps]()
      const storedError = stream._storedError
      stream._writeRequests.forEach((writeRequest) => {
        writeRequest._reject(storedError)
      })
      stream._writeRequests = new SimpleQueue()
      if (stream._pendingAbortRequest === undefined) {
        WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
        return
      }
      const abortRequest = stream._pendingAbortRequest
      stream._pendingAbortRequest = undefined
      if (abortRequest._wasAlreadyErroring) {
        abortRequest._reject(storedError)
        WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
        return
      }
      const promise = stream._writableStreamController[AbortSteps](abortRequest._reason)
      uponPromise(
        promise,
        () => {
          abortRequest._resolve()
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
          return null
        },
        (reason) => {
          abortRequest._reject(reason)
          WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream)
          return null
        },
      )
    }
    function WritableStreamFinishInFlightWrite(stream) {
      stream._inFlightWriteRequest._resolve(undefined)
      stream._inFlightWriteRequest = undefined
    }
    function WritableStreamFinishInFlightWriteWithError(stream, error) {
      stream._inFlightWriteRequest._reject(error)
      stream._inFlightWriteRequest = undefined
      WritableStreamDealWithRejection(stream, error)
    }
    function WritableStreamFinishInFlightClose(stream) {
      stream._inFlightCloseRequest._resolve(undefined)
      stream._inFlightCloseRequest = undefined
      const state = stream._state
      if (state === 'erroring') {
        stream._storedError = undefined
        if (stream._pendingAbortRequest !== undefined) {
          stream._pendingAbortRequest._resolve()
          stream._pendingAbortRequest = undefined
        }
      }
      stream._state = 'closed'
      const writer = stream._writer
      if (writer !== undefined) {
        defaultWriterClosedPromiseResolve(writer)
      }
    }
    function WritableStreamFinishInFlightCloseWithError(stream, error) {
      stream._inFlightCloseRequest._reject(error)
      stream._inFlightCloseRequest = undefined
      if (stream._pendingAbortRequest !== undefined) {
        stream._pendingAbortRequest._reject(error)
        stream._pendingAbortRequest = undefined
      }
      WritableStreamDealWithRejection(stream, error)
    }
    function WritableStreamCloseQueuedOrInFlight(stream) {
      if (stream._closeRequest === undefined && stream._inFlightCloseRequest === undefined) {
        return false
      }
      return true
    }
    function WritableStreamHasOperationMarkedInFlight(stream) {
      if (
        stream._inFlightWriteRequest === undefined &&
        stream._inFlightCloseRequest === undefined
      ) {
        return false
      }
      return true
    }
    function WritableStreamMarkCloseRequestInFlight(stream) {
      stream._inFlightCloseRequest = stream._closeRequest
      stream._closeRequest = undefined
    }
    function WritableStreamMarkFirstWriteRequestInFlight(stream) {
      stream._inFlightWriteRequest = stream._writeRequests.shift()
    }
    function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
      if (stream._closeRequest !== undefined) {
        stream._closeRequest._reject(stream._storedError)
        stream._closeRequest = undefined
      }
      const writer = stream._writer
      if (writer !== undefined) {
        defaultWriterClosedPromiseReject(writer, stream._storedError)
      }
    }
    function WritableStreamUpdateBackpressure(stream, backpressure) {
      const writer = stream._writer
      if (writer !== undefined && backpressure !== stream._backpressure) {
        if (backpressure) {
          defaultWriterReadyPromiseReset(writer)
        } else {
          defaultWriterReadyPromiseResolve(writer)
        }
      }
      stream._backpressure = backpressure
    }

    class WritableStreamDefaultWriter {
      constructor(stream) {
        assertRequiredArgument(stream, 1, 'WritableStreamDefaultWriter')
        assertWritableStream(stream, 'First parameter')
        if (IsWritableStreamLocked(stream)) {
          throw new TypeError(
            'This stream has already been locked for exclusive writing by another writer',
          )
        }
        this._ownerWritableStream = stream
        stream._writer = this
        const state = stream._state
        if (state === 'writable') {
          if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
            defaultWriterReadyPromiseInitialize(this)
          } else {
            defaultWriterReadyPromiseInitializeAsResolved(this)
          }
          defaultWriterClosedPromiseInitialize(this)
        } else if (state === 'erroring') {
          defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError)
          defaultWriterClosedPromiseInitialize(this)
        } else if (state === 'closed') {
          defaultWriterReadyPromiseInitializeAsResolved(this)
          defaultWriterClosedPromiseInitializeAsResolved(this)
        } else {
          const storedError = stream._storedError
          defaultWriterReadyPromiseInitializeAsRejected(this, storedError)
          defaultWriterClosedPromiseInitializeAsRejected(this, storedError)
        }
      }
      get closed() {
        if (!IsWritableStreamDefaultWriter(this)) {
          return promiseRejectedWith(defaultWriterBrandCheckException('closed'))
        }
        return this._closedPromise
      }
      get desiredSize() {
        if (!IsWritableStreamDefaultWriter(this)) {
          throw defaultWriterBrandCheckException('desiredSize')
        }
        if (this._ownerWritableStream === undefined) {
          throw defaultWriterLockException('desiredSize')
        }
        return WritableStreamDefaultWriterGetDesiredSize(this)
      }
      get ready() {
        if (!IsWritableStreamDefaultWriter(this)) {
          return promiseRejectedWith(defaultWriterBrandCheckException('ready'))
        }
        return this._readyPromise
      }
      abort(reason = undefined) {
        if (!IsWritableStreamDefaultWriter(this)) {
          return promiseRejectedWith(defaultWriterBrandCheckException('abort'))
        }
        if (this._ownerWritableStream === undefined) {
          return promiseRejectedWith(defaultWriterLockException('abort'))
        }
        return WritableStreamDefaultWriterAbort(this, reason)
      }
      close() {
        if (!IsWritableStreamDefaultWriter(this)) {
          return promiseRejectedWith(defaultWriterBrandCheckException('close'))
        }
        const stream = this._ownerWritableStream
        if (stream === undefined) {
          return promiseRejectedWith(defaultWriterLockException('close'))
        }
        if (WritableStreamCloseQueuedOrInFlight(stream)) {
          return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'))
        }
        return WritableStreamDefaultWriterClose(this)
      }
      releaseLock() {
        if (!IsWritableStreamDefaultWriter(this)) {
          throw defaultWriterBrandCheckException('releaseLock')
        }
        const stream = this._ownerWritableStream
        if (stream === undefined) {
          return
        }
        WritableStreamDefaultWriterRelease(this)
      }
      write(chunk = undefined) {
        if (!IsWritableStreamDefaultWriter(this)) {
          return promiseRejectedWith(defaultWriterBrandCheckException('write'))
        }
        if (this._ownerWritableStream === undefined) {
          return promiseRejectedWith(defaultWriterLockException('write to'))
        }
        return WritableStreamDefaultWriterWrite(this, chunk)
      }
    }
    Object.defineProperties(WritableStreamDefaultWriter.prototype, {
      abort: { enumerable: true },
      close: { enumerable: true },
      releaseLock: { enumerable: true },
      write: { enumerable: true },
      closed: { enumerable: true },
      desiredSize: { enumerable: true },
      ready: { enumerable: true },
    })
    setFunctionName(WritableStreamDefaultWriter.prototype.abort, 'abort')
    setFunctionName(WritableStreamDefaultWriter.prototype.close, 'close')
    setFunctionName(WritableStreamDefaultWriter.prototype.releaseLock, 'releaseLock')
    setFunctionName(WritableStreamDefaultWriter.prototype.write, 'write')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(WritableStreamDefaultWriter.prototype, Symbol.toStringTag, {
        value: 'WritableStreamDefaultWriter',
        configurable: true,
      })
    }
    function IsWritableStreamDefaultWriter(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_ownerWritableStream')) {
        return false
      }
      return x instanceof WritableStreamDefaultWriter
    }
    function WritableStreamDefaultWriterAbort(writer, reason) {
      const stream = writer._ownerWritableStream
      return WritableStreamAbort(stream, reason)
    }
    function WritableStreamDefaultWriterClose(writer) {
      const stream = writer._ownerWritableStream
      return WritableStreamClose(stream)
    }
    function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
      const stream = writer._ownerWritableStream
      const state = stream._state
      if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
        return promiseResolvedWith(undefined)
      }
      if (state === 'errored') {
        return promiseRejectedWith(stream._storedError)
      }
      return WritableStreamDefaultWriterClose(writer)
    }
    function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error) {
      if (writer._closedPromiseState === 'pending') {
        defaultWriterClosedPromiseReject(writer, error)
      } else {
        defaultWriterClosedPromiseResetToRejected(writer, error)
      }
    }
    function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error) {
      if (writer._readyPromiseState === 'pending') {
        defaultWriterReadyPromiseReject(writer, error)
      } else {
        defaultWriterReadyPromiseResetToRejected(writer, error)
      }
    }
    function WritableStreamDefaultWriterGetDesiredSize(writer) {
      const stream = writer._ownerWritableStream
      const state = stream._state
      if (state === 'errored' || state === 'erroring') {
        return null
      }
      if (state === 'closed') {
        return 0
      }
      return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController)
    }
    function WritableStreamDefaultWriterRelease(writer) {
      const stream = writer._ownerWritableStream
      const releasedError = new TypeError(
        `Writer was released and can no longer be used to monitor the stream's closedness`,
      )
      WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError)
      WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError)
      stream._writer = undefined
      writer._ownerWritableStream = undefined
    }
    function WritableStreamDefaultWriterWrite(writer, chunk) {
      const stream = writer._ownerWritableStream
      const controller = stream._writableStreamController
      const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk)
      if (stream !== writer._ownerWritableStream) {
        return promiseRejectedWith(defaultWriterLockException('write to'))
      }
      const state = stream._state
      if (state === 'errored') {
        return promiseRejectedWith(stream._storedError)
      }
      if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
        return promiseRejectedWith(
          new TypeError('The stream is closing or closed and cannot be written to'),
        )
      }
      if (state === 'erroring') {
        return promiseRejectedWith(stream._storedError)
      }
      const promise = WritableStreamAddWriteRequest(stream)
      WritableStreamDefaultControllerWrite(controller, chunk, chunkSize)
      return promise
    }
    const closeSentinel = {}

    class WritableStreamDefaultController {
      constructor() {
        throw new TypeError('Illegal constructor')
      }
      get abortReason() {
        if (!IsWritableStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException$2('abortReason')
        }
        return this._abortReason
      }
      get signal() {
        if (!IsWritableStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException$2('signal')
        }
        if (this._abortController === undefined) {
          throw new TypeError('WritableStreamDefaultController.prototype.signal is not supported')
        }
        return this._abortController.signal
      }
      error(e = undefined) {
        if (!IsWritableStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException$2('error')
        }
        const state = this._controlledWritableStream._state
        if (state !== 'writable') {
          return
        }
        WritableStreamDefaultControllerError(this, e)
      }
      [AbortSteps](reason) {
        const result = this._abortAlgorithm(reason)
        WritableStreamDefaultControllerClearAlgorithms(this)
        return result
      }
      [ErrorSteps]() {
        ResetQueue(this)
      }
    }
    Object.defineProperties(WritableStreamDefaultController.prototype, {
      abortReason: { enumerable: true },
      signal: { enumerable: true },
      error: { enumerable: true },
    })
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(WritableStreamDefaultController.prototype, Symbol.toStringTag, {
        value: 'WritableStreamDefaultController',
        configurable: true,
      })
    }
    function IsWritableStreamDefaultController(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_controlledWritableStream')) {
        return false
      }
      return x instanceof WritableStreamDefaultController
    }
    function SetUpWritableStreamDefaultController(
      stream,
      controller,
      startAlgorithm,
      writeAlgorithm,
      closeAlgorithm,
      abortAlgorithm,
      highWaterMark,
      sizeAlgorithm,
    ) {
      controller._controlledWritableStream = stream
      stream._writableStreamController = controller
      controller._queue = undefined
      controller._queueTotalSize = undefined
      ResetQueue(controller)
      controller._abortReason = undefined
      controller._abortController = createAbortController()
      controller._started = false
      controller._strategySizeAlgorithm = sizeAlgorithm
      controller._strategyHWM = highWaterMark
      controller._writeAlgorithm = writeAlgorithm
      controller._closeAlgorithm = closeAlgorithm
      controller._abortAlgorithm = abortAlgorithm
      const backpressure = WritableStreamDefaultControllerGetBackpressure(controller)
      WritableStreamUpdateBackpressure(stream, backpressure)
      const startResult = startAlgorithm()
      const startPromise = promiseResolvedWith(startResult)
      uponPromise(
        startPromise,
        () => {
          controller._started = true
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
          return null
        },
        (r) => {
          controller._started = true
          WritableStreamDealWithRejection(stream, r)
          return null
        },
      )
    }
    function SetUpWritableStreamDefaultControllerFromUnderlyingSink(
      stream,
      underlyingSink,
      highWaterMark,
      sizeAlgorithm,
    ) {
      const controller = Object.create(WritableStreamDefaultController.prototype)
      let startAlgorithm
      let writeAlgorithm
      let closeAlgorithm
      let abortAlgorithm
      if (underlyingSink.start !== undefined) {
        startAlgorithm = () => underlyingSink.start(controller)
      } else {
        startAlgorithm = () => {
          return
        }
      }
      if (underlyingSink.write !== undefined) {
        writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller)
      } else {
        writeAlgorithm = () => promiseResolvedWith(undefined)
      }
      if (underlyingSink.close !== undefined) {
        closeAlgorithm = () => underlyingSink.close()
      } else {
        closeAlgorithm = () => promiseResolvedWith(undefined)
      }
      if (underlyingSink.abort !== undefined) {
        abortAlgorithm = (reason) => underlyingSink.abort(reason)
      } else {
        abortAlgorithm = () => promiseResolvedWith(undefined)
      }
      SetUpWritableStreamDefaultController(
        stream,
        controller,
        startAlgorithm,
        writeAlgorithm,
        closeAlgorithm,
        abortAlgorithm,
        highWaterMark,
        sizeAlgorithm,
      )
    }
    function WritableStreamDefaultControllerClearAlgorithms(controller) {
      controller._writeAlgorithm = undefined
      controller._closeAlgorithm = undefined
      controller._abortAlgorithm = undefined
      controller._strategySizeAlgorithm = undefined
    }
    function WritableStreamDefaultControllerClose(controller) {
      EnqueueValueWithSize(controller, closeSentinel, 0)
      WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
    }
    function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
      try {
        return controller._strategySizeAlgorithm(chunk)
      } catch (chunkSizeE) {
        WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE)
        return 1
      }
    }
    function WritableStreamDefaultControllerGetDesiredSize(controller) {
      return controller._strategyHWM - controller._queueTotalSize
    }
    function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
      try {
        EnqueueValueWithSize(controller, chunk, chunkSize)
      } catch (enqueueE) {
        WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE)
        return
      }
      const stream = controller._controlledWritableStream
      if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === 'writable') {
        const backpressure = WritableStreamDefaultControllerGetBackpressure(controller)
        WritableStreamUpdateBackpressure(stream, backpressure)
      }
      WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
    }
    function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
      const stream = controller._controlledWritableStream
      if (!controller._started) {
        return
      }
      if (stream._inFlightWriteRequest !== undefined) {
        return
      }
      const state = stream._state
      if (state === 'erroring') {
        WritableStreamFinishErroring(stream)
        return
      }
      if (controller._queue.length === 0) {
        return
      }
      const value = PeekQueueValue(controller)
      if (value === closeSentinel) {
        WritableStreamDefaultControllerProcessClose(controller)
      } else {
        WritableStreamDefaultControllerProcessWrite(controller, value)
      }
    }
    function WritableStreamDefaultControllerErrorIfNeeded(controller, error) {
      if (controller._controlledWritableStream._state === 'writable') {
        WritableStreamDefaultControllerError(controller, error)
      }
    }
    function WritableStreamDefaultControllerProcessClose(controller) {
      const stream = controller._controlledWritableStream
      WritableStreamMarkCloseRequestInFlight(stream)
      DequeueValue(controller)
      const sinkClosePromise = controller._closeAlgorithm()
      WritableStreamDefaultControllerClearAlgorithms(controller)
      uponPromise(
        sinkClosePromise,
        () => {
          WritableStreamFinishInFlightClose(stream)
          return null
        },
        (reason) => {
          WritableStreamFinishInFlightCloseWithError(stream, reason)
          return null
        },
      )
    }
    function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
      const stream = controller._controlledWritableStream
      WritableStreamMarkFirstWriteRequestInFlight(stream)
      const sinkWritePromise = controller._writeAlgorithm(chunk)
      uponPromise(
        sinkWritePromise,
        () => {
          WritableStreamFinishInFlightWrite(stream)
          const state = stream._state
          DequeueValue(controller)
          if (!WritableStreamCloseQueuedOrInFlight(stream) && state === 'writable') {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller)
            WritableStreamUpdateBackpressure(stream, backpressure)
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller)
          return null
        },
        (reason) => {
          if (stream._state === 'writable') {
            WritableStreamDefaultControllerClearAlgorithms(controller)
          }
          WritableStreamFinishInFlightWriteWithError(stream, reason)
          return null
        },
      )
    }
    function WritableStreamDefaultControllerGetBackpressure(controller) {
      const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller)
      return desiredSize <= 0
    }
    function WritableStreamDefaultControllerError(controller, error) {
      const stream = controller._controlledWritableStream
      WritableStreamDefaultControllerClearAlgorithms(controller)
      WritableStreamStartErroring(stream, error)
    }
    function streamBrandCheckException$2(name) {
      return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`)
    }
    function defaultControllerBrandCheckException$2(name) {
      return new TypeError(
        `WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`,
      )
    }
    function defaultWriterBrandCheckException(name) {
      return new TypeError(
        `WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`,
      )
    }
    function defaultWriterLockException(name) {
      return new TypeError(`Cannot ${name} a stream using a released writer`)
    }
    function defaultWriterClosedPromiseInitialize(writer) {
      writer._closedPromise = newPromise((resolve, reject) => {
        writer._closedPromise_resolve = resolve
        writer._closedPromise_reject = reject
        writer._closedPromiseState = 'pending'
      })
    }
    function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
      defaultWriterClosedPromiseInitialize(writer)
      defaultWriterClosedPromiseReject(writer, reason)
    }
    function defaultWriterClosedPromiseInitializeAsResolved(writer) {
      defaultWriterClosedPromiseInitialize(writer)
      defaultWriterClosedPromiseResolve(writer)
    }
    function defaultWriterClosedPromiseReject(writer, reason) {
      if (writer._closedPromise_reject === undefined) {
        return
      }
      setPromiseIsHandledToTrue(writer._closedPromise)
      writer._closedPromise_reject(reason)
      writer._closedPromise_resolve = undefined
      writer._closedPromise_reject = undefined
      writer._closedPromiseState = 'rejected'
    }
    function defaultWriterClosedPromiseResetToRejected(writer, reason) {
      defaultWriterClosedPromiseInitializeAsRejected(writer, reason)
    }
    function defaultWriterClosedPromiseResolve(writer) {
      if (writer._closedPromise_resolve === undefined) {
        return
      }
      writer._closedPromise_resolve(undefined)
      writer._closedPromise_resolve = undefined
      writer._closedPromise_reject = undefined
      writer._closedPromiseState = 'resolved'
    }
    function defaultWriterReadyPromiseInitialize(writer) {
      writer._readyPromise = newPromise((resolve, reject) => {
        writer._readyPromise_resolve = resolve
        writer._readyPromise_reject = reject
      })
      writer._readyPromiseState = 'pending'
    }
    function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
      defaultWriterReadyPromiseInitialize(writer)
      defaultWriterReadyPromiseReject(writer, reason)
    }
    function defaultWriterReadyPromiseInitializeAsResolved(writer) {
      defaultWriterReadyPromiseInitialize(writer)
      defaultWriterReadyPromiseResolve(writer)
    }
    function defaultWriterReadyPromiseReject(writer, reason) {
      if (writer._readyPromise_reject === undefined) {
        return
      }
      setPromiseIsHandledToTrue(writer._readyPromise)
      writer._readyPromise_reject(reason)
      writer._readyPromise_resolve = undefined
      writer._readyPromise_reject = undefined
      writer._readyPromiseState = 'rejected'
    }
    function defaultWriterReadyPromiseReset(writer) {
      defaultWriterReadyPromiseInitialize(writer)
    }
    function defaultWriterReadyPromiseResetToRejected(writer, reason) {
      defaultWriterReadyPromiseInitializeAsRejected(writer, reason)
    }
    function defaultWriterReadyPromiseResolve(writer) {
      if (writer._readyPromise_resolve === undefined) {
        return
      }
      writer._readyPromise_resolve(undefined)
      writer._readyPromise_resolve = undefined
      writer._readyPromise_reject = undefined
      writer._readyPromiseState = 'fulfilled'
    }
    function getGlobals() {
      if (typeof globalThis !== 'undefined') {
        return globalThis
      }
      if (typeof self !== 'undefined') {
        return self
      }
      if (typeof global !== 'undefined') {
        return global
      }
      return
    }
    const globals = getGlobals()
    function isDOMExceptionConstructor(ctor) {
      if (!(typeof ctor === 'function' || typeof ctor === 'object')) {
        return false
      }
      if (ctor.name !== 'DOMException') {
        return false
      }
      try {
        new ctor()
        return true
      } catch (_a2) {
        return false
      }
    }
    function getFromGlobal() {
      const ctor = globals === null || globals === undefined ? undefined : globals.DOMException
      return isDOMExceptionConstructor(ctor) ? ctor : undefined
    }
    function createPolyfill() {
      const ctor = function DOMException(message, name) {
        this.message = message || ''
        this.name = name || 'Error'
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, this.constructor)
        }
      }
      setFunctionName(ctor, 'DOMException')
      ctor.prototype = Object.create(Error.prototype)
      Object.defineProperty(ctor.prototype, 'constructor', {
        value: ctor,
        writable: true,
        configurable: true,
      })
      return ctor
    }
    const DOMException = getFromGlobal() || createPolyfill()
    function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
      const reader = AcquireReadableStreamDefaultReader(source)
      const writer = AcquireWritableStreamDefaultWriter(dest)
      source._disturbed = true
      let shuttingDown = false
      let currentWrite = promiseResolvedWith(undefined)
      return newPromise((resolve, reject) => {
        let abortAlgorithm
        if (signal !== undefined) {
          abortAlgorithm = () => {
            const error =
              signal.reason !== undefined
                ? signal.reason
                : new DOMException('Aborted', 'AbortError')
            const actions = []
            if (!preventAbort) {
              actions.push(() => {
                if (dest._state === 'writable') {
                  return WritableStreamAbort(dest, error)
                }
                return promiseResolvedWith(undefined)
              })
            }
            if (!preventCancel) {
              actions.push(() => {
                if (source._state === 'readable') {
                  return ReadableStreamCancel(source, error)
                }
                return promiseResolvedWith(undefined)
              })
            }
            shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error)
          }
          if (signal.aborted) {
            abortAlgorithm()
            return
          }
          signal.addEventListener('abort', abortAlgorithm)
        }
        function pipeLoop() {
          return newPromise((resolveLoop, rejectLoop) => {
            function next(done) {
              if (done) {
                resolveLoop()
              } else {
                PerformPromiseThen(pipeStep(), next, rejectLoop)
              }
            }
            next(false)
          })
        }
        function pipeStep() {
          if (shuttingDown) {
            return promiseResolvedWith(true)
          }
          return PerformPromiseThen(writer._readyPromise, () => {
            return newPromise((resolveRead, rejectRead) => {
              ReadableStreamDefaultReaderRead(reader, {
                _chunkSteps: (chunk) => {
                  currentWrite = PerformPromiseThen(
                    WritableStreamDefaultWriterWrite(writer, chunk),
                    undefined,
                    noop,
                  )
                  resolveRead(false)
                },
                _closeSteps: () => resolveRead(true),
                _errorSteps: rejectRead,
              })
            })
          })
        }
        isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
          if (preventAbort) {
            shutdown(true, storedError)
          } else {
            shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError)
          }
          return null
        })
        isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
          if (preventCancel) {
            shutdown(true, storedError)
          } else {
            shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError)
          }
          return null
        })
        isOrBecomesClosed(source, reader._closedPromise, () => {
          if (preventClose) {
            shutdown()
          } else {
            shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer))
          }
          return null
        })
        if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === 'closed') {
          const destClosed = new TypeError(
            'the destination writable stream closed before all data could be piped to it',
          )
          if (preventCancel) {
            shutdown(true, destClosed)
          } else {
            shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed)
          }
        }
        setPromiseIsHandledToTrue(pipeLoop())
        function waitForWritesToFinish() {
          const oldCurrentWrite = currentWrite
          return PerformPromiseThen(currentWrite, () =>
            oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : undefined,
          )
        }
        function isOrBecomesErrored(stream, promise, action) {
          if (stream._state === 'errored') {
            action(stream._storedError)
          } else {
            uponRejection(promise, action)
          }
        }
        function isOrBecomesClosed(stream, promise, action) {
          if (stream._state === 'closed') {
            action()
          } else {
            uponFulfillment(promise, action)
          }
        }
        function shutdownWithAction(action, originalIsError, originalError) {
          if (shuttingDown) {
            return
          }
          shuttingDown = true
          if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
            uponFulfillment(waitForWritesToFinish(), doTheRest)
          } else {
            doTheRest()
          }
          function doTheRest() {
            uponPromise(
              action(),
              () => finalize(originalIsError, originalError),
              (newError) => finalize(true, newError),
            )
            return null
          }
        }
        function shutdown(isError, error) {
          if (shuttingDown) {
            return
          }
          shuttingDown = true
          if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
            uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error))
          } else {
            finalize(isError, error)
          }
        }
        function finalize(isError, error) {
          WritableStreamDefaultWriterRelease(writer)
          ReadableStreamReaderGenericRelease(reader)
          if (signal !== undefined) {
            signal.removeEventListener('abort', abortAlgorithm)
          }
          if (isError) {
            reject(error)
          } else {
            resolve(undefined)
          }
          return null
        }
      })
    }

    class ReadableStreamDefaultController {
      constructor() {
        throw new TypeError('Illegal constructor')
      }
      get desiredSize() {
        if (!IsReadableStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException$1('desiredSize')
        }
        return ReadableStreamDefaultControllerGetDesiredSize(this)
      }
      close() {
        if (!IsReadableStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException$1('close')
        }
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
          throw new TypeError('The stream is not in a state that permits close')
        }
        ReadableStreamDefaultControllerClose(this)
      }
      enqueue(chunk = undefined) {
        if (!IsReadableStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException$1('enqueue')
        }
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
          throw new TypeError('The stream is not in a state that permits enqueue')
        }
        return ReadableStreamDefaultControllerEnqueue(this, chunk)
      }
      error(e = undefined) {
        if (!IsReadableStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException$1('error')
        }
        ReadableStreamDefaultControllerError(this, e)
      }
      [CancelSteps](reason) {
        ResetQueue(this)
        const result = this._cancelAlgorithm(reason)
        ReadableStreamDefaultControllerClearAlgorithms(this)
        return result
      }
      [PullSteps](readRequest) {
        const stream = this._controlledReadableStream
        if (this._queue.length > 0) {
          const chunk = DequeueValue(this)
          if (this._closeRequested && this._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(this)
            ReadableStreamClose(stream)
          } else {
            ReadableStreamDefaultControllerCallPullIfNeeded(this)
          }
          readRequest._chunkSteps(chunk)
        } else {
          ReadableStreamAddReadRequest(stream, readRequest)
          ReadableStreamDefaultControllerCallPullIfNeeded(this)
        }
      }
      [ReleaseSteps]() {}
    }
    Object.defineProperties(ReadableStreamDefaultController.prototype, {
      close: { enumerable: true },
      enqueue: { enumerable: true },
      error: { enumerable: true },
      desiredSize: { enumerable: true },
    })
    setFunctionName(ReadableStreamDefaultController.prototype.close, 'close')
    setFunctionName(ReadableStreamDefaultController.prototype.enqueue, 'enqueue')
    setFunctionName(ReadableStreamDefaultController.prototype.error, 'error')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(ReadableStreamDefaultController.prototype, Symbol.toStringTag, {
        value: 'ReadableStreamDefaultController',
        configurable: true,
      })
    }
    function IsReadableStreamDefaultController(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_controlledReadableStream')) {
        return false
      }
      return x instanceof ReadableStreamDefaultController
    }
    function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
      const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller)
      if (!shouldPull) {
        return
      }
      if (controller._pulling) {
        controller._pullAgain = true
        return
      }
      controller._pulling = true
      const pullPromise = controller._pullAlgorithm()
      uponPromise(
        pullPromise,
        () => {
          controller._pulling = false
          if (controller._pullAgain) {
            controller._pullAgain = false
            ReadableStreamDefaultControllerCallPullIfNeeded(controller)
          }
          return null
        },
        (e) => {
          ReadableStreamDefaultControllerError(controller, e)
          return null
        },
      )
    }
    function ReadableStreamDefaultControllerShouldCallPull(controller) {
      const stream = controller._controlledReadableStream
      if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
        return false
      }
      if (!controller._started) {
        return false
      }
      if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
        return true
      }
      const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller)
      if (desiredSize > 0) {
        return true
      }
      return false
    }
    function ReadableStreamDefaultControllerClearAlgorithms(controller) {
      controller._pullAlgorithm = undefined
      controller._cancelAlgorithm = undefined
      controller._strategySizeAlgorithm = undefined
    }
    function ReadableStreamDefaultControllerClose(controller) {
      if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
        return
      }
      const stream = controller._controlledReadableStream
      controller._closeRequested = true
      if (controller._queue.length === 0) {
        ReadableStreamDefaultControllerClearAlgorithms(controller)
        ReadableStreamClose(stream)
      }
    }
    function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
      if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
        return
      }
      const stream = controller._controlledReadableStream
      if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
        ReadableStreamFulfillReadRequest(stream, chunk, false)
      } else {
        let chunkSize
        try {
          chunkSize = controller._strategySizeAlgorithm(chunk)
        } catch (chunkSizeE) {
          ReadableStreamDefaultControllerError(controller, chunkSizeE)
          throw chunkSizeE
        }
        try {
          EnqueueValueWithSize(controller, chunk, chunkSize)
        } catch (enqueueE) {
          ReadableStreamDefaultControllerError(controller, enqueueE)
          throw enqueueE
        }
      }
      ReadableStreamDefaultControllerCallPullIfNeeded(controller)
    }
    function ReadableStreamDefaultControllerError(controller, e) {
      const stream = controller._controlledReadableStream
      if (stream._state !== 'readable') {
        return
      }
      ResetQueue(controller)
      ReadableStreamDefaultControllerClearAlgorithms(controller)
      ReadableStreamError(stream, e)
    }
    function ReadableStreamDefaultControllerGetDesiredSize(controller) {
      const state = controller._controlledReadableStream._state
      if (state === 'errored') {
        return null
      }
      if (state === 'closed') {
        return 0
      }
      return controller._strategyHWM - controller._queueTotalSize
    }
    function ReadableStreamDefaultControllerHasBackpressure(controller) {
      if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
        return false
      }
      return true
    }
    function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
      const state = controller._controlledReadableStream._state
      if (!controller._closeRequested && state === 'readable') {
        return true
      }
      return false
    }
    function SetUpReadableStreamDefaultController(
      stream,
      controller,
      startAlgorithm,
      pullAlgorithm,
      cancelAlgorithm,
      highWaterMark,
      sizeAlgorithm,
    ) {
      controller._controlledReadableStream = stream
      controller._queue = undefined
      controller._queueTotalSize = undefined
      ResetQueue(controller)
      controller._started = false
      controller._closeRequested = false
      controller._pullAgain = false
      controller._pulling = false
      controller._strategySizeAlgorithm = sizeAlgorithm
      controller._strategyHWM = highWaterMark
      controller._pullAlgorithm = pullAlgorithm
      controller._cancelAlgorithm = cancelAlgorithm
      stream._readableStreamController = controller
      const startResult = startAlgorithm()
      uponPromise(
        promiseResolvedWith(startResult),
        () => {
          controller._started = true
          ReadableStreamDefaultControllerCallPullIfNeeded(controller)
          return null
        },
        (r) => {
          ReadableStreamDefaultControllerError(controller, r)
          return null
        },
      )
    }
    function SetUpReadableStreamDefaultControllerFromUnderlyingSource(
      stream,
      underlyingSource,
      highWaterMark,
      sizeAlgorithm,
    ) {
      const controller = Object.create(ReadableStreamDefaultController.prototype)
      let startAlgorithm
      let pullAlgorithm
      let cancelAlgorithm
      if (underlyingSource.start !== undefined) {
        startAlgorithm = () => underlyingSource.start(controller)
      } else {
        startAlgorithm = () => {
          return
        }
      }
      if (underlyingSource.pull !== undefined) {
        pullAlgorithm = () => underlyingSource.pull(controller)
      } else {
        pullAlgorithm = () => promiseResolvedWith(undefined)
      }
      if (underlyingSource.cancel !== undefined) {
        cancelAlgorithm = (reason) => underlyingSource.cancel(reason)
      } else {
        cancelAlgorithm = () => promiseResolvedWith(undefined)
      }
      SetUpReadableStreamDefaultController(
        stream,
        controller,
        startAlgorithm,
        pullAlgorithm,
        cancelAlgorithm,
        highWaterMark,
        sizeAlgorithm,
      )
    }
    function defaultControllerBrandCheckException$1(name) {
      return new TypeError(
        `ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`,
      )
    }
    function ReadableStreamTee(stream, _cloneForBranch2) {
      if (IsReadableByteStreamController(stream._readableStreamController)) {
        return ReadableByteStreamTee(stream)
      }
      return ReadableStreamDefaultTee(stream)
    }
    function ReadableStreamDefaultTee(stream, _cloneForBranch2) {
      const reader = AcquireReadableStreamDefaultReader(stream)
      let reading = false
      let readAgain = false
      let canceled1 = false
      let canceled2 = false
      let reason1
      let reason2
      let branch1
      let branch2
      let resolveCancelPromise
      const cancelPromise = newPromise((resolve) => {
        resolveCancelPromise = resolve
      })
      function pullAlgorithm() {
        if (reading) {
          readAgain = true
          return promiseResolvedWith(undefined)
        }
        reading = true
        const readRequest = {
          _chunkSteps: (chunk) => {
            _queueMicrotask(() => {
              readAgain = false
              const chunk1 = chunk
              const chunk2 = chunk
              if (!canceled1) {
                ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1)
              }
              if (!canceled2) {
                ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2)
              }
              reading = false
              if (readAgain) {
                pullAlgorithm()
              }
            })
          },
          _closeSteps: () => {
            reading = false
            if (!canceled1) {
              ReadableStreamDefaultControllerClose(branch1._readableStreamController)
            }
            if (!canceled2) {
              ReadableStreamDefaultControllerClose(branch2._readableStreamController)
            }
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(undefined)
            }
          },
          _errorSteps: () => {
            reading = false
          },
        }
        ReadableStreamDefaultReaderRead(reader, readRequest)
        return promiseResolvedWith(undefined)
      }
      function cancel1Algorithm(reason) {
        canceled1 = true
        reason1 = reason
        if (canceled2) {
          const compositeReason = CreateArrayFromList([reason1, reason2])
          const cancelResult = ReadableStreamCancel(stream, compositeReason)
          resolveCancelPromise(cancelResult)
        }
        return cancelPromise
      }
      function cancel2Algorithm(reason) {
        canceled2 = true
        reason2 = reason
        if (canceled1) {
          const compositeReason = CreateArrayFromList([reason1, reason2])
          const cancelResult = ReadableStreamCancel(stream, compositeReason)
          resolveCancelPromise(cancelResult)
        }
        return cancelPromise
      }
      function startAlgorithm() {}
      branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm)
      branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm)
      uponRejection(reader._closedPromise, (r) => {
        ReadableStreamDefaultControllerError(branch1._readableStreamController, r)
        ReadableStreamDefaultControllerError(branch2._readableStreamController, r)
        if (!canceled1 || !canceled2) {
          resolveCancelPromise(undefined)
        }
        return null
      })
      return [branch1, branch2]
    }
    function ReadableByteStreamTee(stream) {
      let reader = AcquireReadableStreamDefaultReader(stream)
      let reading = false
      let readAgainForBranch1 = false
      let readAgainForBranch2 = false
      let canceled1 = false
      let canceled2 = false
      let reason1
      let reason2
      let branch1
      let branch2
      let resolveCancelPromise
      const cancelPromise = newPromise((resolve) => {
        resolveCancelPromise = resolve
      })
      function forwardReaderError(thisReader) {
        uponRejection(thisReader._closedPromise, (r) => {
          if (thisReader !== reader) {
            return null
          }
          ReadableByteStreamControllerError(branch1._readableStreamController, r)
          ReadableByteStreamControllerError(branch2._readableStreamController, r)
          if (!canceled1 || !canceled2) {
            resolveCancelPromise(undefined)
          }
          return null
        })
      }
      function pullWithDefaultReader() {
        if (IsReadableStreamBYOBReader(reader)) {
          ReadableStreamReaderGenericRelease(reader)
          reader = AcquireReadableStreamDefaultReader(stream)
          forwardReaderError(reader)
        }
        const readRequest = {
          _chunkSteps: (chunk) => {
            _queueMicrotask(() => {
              readAgainForBranch1 = false
              readAgainForBranch2 = false
              const chunk1 = chunk
              let chunk2 = chunk
              if (!canceled1 && !canceled2) {
                try {
                  chunk2 = CloneAsUint8Array(chunk)
                } catch (cloneE) {
                  ReadableByteStreamControllerError(branch1._readableStreamController, cloneE)
                  ReadableByteStreamControllerError(branch2._readableStreamController, cloneE)
                  resolveCancelPromise(ReadableStreamCancel(stream, cloneE))
                  return
                }
              }
              if (!canceled1) {
                ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1)
              }
              if (!canceled2) {
                ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2)
              }
              reading = false
              if (readAgainForBranch1) {
                pull1Algorithm()
              } else if (readAgainForBranch2) {
                pull2Algorithm()
              }
            })
          },
          _closeSteps: () => {
            reading = false
            if (!canceled1) {
              ReadableByteStreamControllerClose(branch1._readableStreamController)
            }
            if (!canceled2) {
              ReadableByteStreamControllerClose(branch2._readableStreamController)
            }
            if (branch1._readableStreamController._pendingPullIntos.length > 0) {
              ReadableByteStreamControllerRespond(branch1._readableStreamController, 0)
            }
            if (branch2._readableStreamController._pendingPullIntos.length > 0) {
              ReadableByteStreamControllerRespond(branch2._readableStreamController, 0)
            }
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(undefined)
            }
          },
          _errorSteps: () => {
            reading = false
          },
        }
        ReadableStreamDefaultReaderRead(reader, readRequest)
      }
      function pullWithBYOBReader(view, forBranch2) {
        if (IsReadableStreamDefaultReader(reader)) {
          ReadableStreamReaderGenericRelease(reader)
          reader = AcquireReadableStreamBYOBReader(stream)
          forwardReaderError(reader)
        }
        const byobBranch = forBranch2 ? branch2 : branch1
        const otherBranch = forBranch2 ? branch1 : branch2
        const readIntoRequest = {
          _chunkSteps: (chunk) => {
            _queueMicrotask(() => {
              readAgainForBranch1 = false
              readAgainForBranch2 = false
              const byobCanceled = forBranch2 ? canceled2 : canceled1
              const otherCanceled = forBranch2 ? canceled1 : canceled2
              if (!otherCanceled) {
                let clonedChunk
                try {
                  clonedChunk = CloneAsUint8Array(chunk)
                } catch (cloneE) {
                  ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE)
                  ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE)
                  resolveCancelPromise(ReadableStreamCancel(stream, cloneE))
                  return
                }
                if (!byobCanceled) {
                  ReadableByteStreamControllerRespondWithNewView(
                    byobBranch._readableStreamController,
                    chunk,
                  )
                }
                ReadableByteStreamControllerEnqueue(
                  otherBranch._readableStreamController,
                  clonedChunk,
                )
              } else if (!byobCanceled) {
                ReadableByteStreamControllerRespondWithNewView(
                  byobBranch._readableStreamController,
                  chunk,
                )
              }
              reading = false
              if (readAgainForBranch1) {
                pull1Algorithm()
              } else if (readAgainForBranch2) {
                pull2Algorithm()
              }
            })
          },
          _closeSteps: (chunk) => {
            reading = false
            const byobCanceled = forBranch2 ? canceled2 : canceled1
            const otherCanceled = forBranch2 ? canceled1 : canceled2
            if (!byobCanceled) {
              ReadableByteStreamControllerClose(byobBranch._readableStreamController)
            }
            if (!otherCanceled) {
              ReadableByteStreamControllerClose(otherBranch._readableStreamController)
            }
            if (chunk !== undefined) {
              if (!byobCanceled) {
                ReadableByteStreamControllerRespondWithNewView(
                  byobBranch._readableStreamController,
                  chunk,
                )
              }
              if (
                !otherCanceled &&
                otherBranch._readableStreamController._pendingPullIntos.length > 0
              ) {
                ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0)
              }
            }
            if (!byobCanceled || !otherCanceled) {
              resolveCancelPromise(undefined)
            }
          },
          _errorSteps: () => {
            reading = false
          },
        }
        ReadableStreamBYOBReaderRead(reader, view, 1, readIntoRequest)
      }
      function pull1Algorithm() {
        if (reading) {
          readAgainForBranch1 = true
          return promiseResolvedWith(undefined)
        }
        reading = true
        const byobRequest = ReadableByteStreamControllerGetBYOBRequest(
          branch1._readableStreamController,
        )
        if (byobRequest === null) {
          pullWithDefaultReader()
        } else {
          pullWithBYOBReader(byobRequest._view, false)
        }
        return promiseResolvedWith(undefined)
      }
      function pull2Algorithm() {
        if (reading) {
          readAgainForBranch2 = true
          return promiseResolvedWith(undefined)
        }
        reading = true
        const byobRequest = ReadableByteStreamControllerGetBYOBRequest(
          branch2._readableStreamController,
        )
        if (byobRequest === null) {
          pullWithDefaultReader()
        } else {
          pullWithBYOBReader(byobRequest._view, true)
        }
        return promiseResolvedWith(undefined)
      }
      function cancel1Algorithm(reason) {
        canceled1 = true
        reason1 = reason
        if (canceled2) {
          const compositeReason = CreateArrayFromList([reason1, reason2])
          const cancelResult = ReadableStreamCancel(stream, compositeReason)
          resolveCancelPromise(cancelResult)
        }
        return cancelPromise
      }
      function cancel2Algorithm(reason) {
        canceled2 = true
        reason2 = reason
        if (canceled1) {
          const compositeReason = CreateArrayFromList([reason1, reason2])
          const cancelResult = ReadableStreamCancel(stream, compositeReason)
          resolveCancelPromise(cancelResult)
        }
        return cancelPromise
      }
      function startAlgorithm() {
        return
      }
      branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm)
      branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm)
      forwardReaderError(reader)
      return [branch1, branch2]
    }
    function isReadableStreamLike(stream) {
      return typeIsObject(stream) && typeof stream.getReader !== 'undefined'
    }
    function ReadableStreamFrom(source) {
      if (isReadableStreamLike(source)) {
        return ReadableStreamFromDefaultReader(source.getReader())
      }
      return ReadableStreamFromIterable(source)
    }
    function ReadableStreamFromIterable(asyncIterable) {
      let stream
      const iteratorRecord = GetIterator(asyncIterable, 'async')
      const startAlgorithm = noop
      function pullAlgorithm() {
        let nextResult
        try {
          nextResult = IteratorNext(iteratorRecord)
        } catch (e) {
          return promiseRejectedWith(e)
        }
        const nextPromise = promiseResolvedWith(nextResult)
        return transformPromiseWith(nextPromise, (iterResult) => {
          if (!typeIsObject(iterResult)) {
            throw new TypeError(
              'The promise returned by the iterator.next() method must fulfill with an object',
            )
          }
          const done = IteratorComplete(iterResult)
          if (done) {
            ReadableStreamDefaultControllerClose(stream._readableStreamController)
          } else {
            const value = IteratorValue(iterResult)
            ReadableStreamDefaultControllerEnqueue(stream._readableStreamController, value)
          }
        })
      }
      function cancelAlgorithm(reason) {
        const iterator = iteratorRecord.iterator
        let returnMethod
        try {
          returnMethod = GetMethod(iterator, 'return')
        } catch (e) {
          return promiseRejectedWith(e)
        }
        if (returnMethod === undefined) {
          return promiseResolvedWith(undefined)
        }
        let returnResult
        try {
          returnResult = reflectCall(returnMethod, iterator, [reason])
        } catch (e) {
          return promiseRejectedWith(e)
        }
        const returnPromise = promiseResolvedWith(returnResult)
        return transformPromiseWith(returnPromise, (iterResult) => {
          if (!typeIsObject(iterResult)) {
            throw new TypeError(
              'The promise returned by the iterator.return() method must fulfill with an object',
            )
          }
          return
        })
      }
      stream = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, 0)
      return stream
    }
    function ReadableStreamFromDefaultReader(reader) {
      let stream
      const startAlgorithm = noop
      function pullAlgorithm() {
        let readPromise
        try {
          readPromise = reader.read()
        } catch (e) {
          return promiseRejectedWith(e)
        }
        return transformPromiseWith(readPromise, (readResult) => {
          if (!typeIsObject(readResult)) {
            throw new TypeError(
              'The promise returned by the reader.read() method must fulfill with an object',
            )
          }
          if (readResult.done) {
            ReadableStreamDefaultControllerClose(stream._readableStreamController)
          } else {
            const value = readResult.value
            ReadableStreamDefaultControllerEnqueue(stream._readableStreamController, value)
          }
        })
      }
      function cancelAlgorithm(reason) {
        try {
          return promiseResolvedWith(reader.cancel(reason))
        } catch (e) {
          return promiseRejectedWith(e)
        }
      }
      stream = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, 0)
      return stream
    }
    function convertUnderlyingDefaultOrByteSource(source, context) {
      assertDictionary(source, context)
      const original = source
      const autoAllocateChunkSize =
        original === null || original === undefined ? undefined : original.autoAllocateChunkSize
      const cancel = original === null || original === undefined ? undefined : original.cancel
      const pull = original === null || original === undefined ? undefined : original.pull
      const start = original === null || original === undefined ? undefined : original.start
      const type = original === null || original === undefined ? undefined : original.type
      return {
        autoAllocateChunkSize:
          autoAllocateChunkSize === undefined
            ? undefined
            : convertUnsignedLongLongWithEnforceRange(
                autoAllocateChunkSize,
                `${context} has member 'autoAllocateChunkSize' that`,
              ),
        cancel:
          cancel === undefined
            ? undefined
            : convertUnderlyingSourceCancelCallback(
                cancel,
                original,
                `${context} has member 'cancel' that`,
              ),
        pull:
          pull === undefined
            ? undefined
            : convertUnderlyingSourcePullCallback(
                pull,
                original,
                `${context} has member 'pull' that`,
              ),
        start:
          start === undefined
            ? undefined
            : convertUnderlyingSourceStartCallback(
                start,
                original,
                `${context} has member 'start' that`,
              ),
        type:
          type === undefined
            ? undefined
            : convertReadableStreamType(type, `${context} has member 'type' that`),
      }
    }
    function convertUnderlyingSourceCancelCallback(fn, original, context) {
      assertFunction(fn, context)
      return (reason) => promiseCall(fn, original, [reason])
    }
    function convertUnderlyingSourcePullCallback(fn, original, context) {
      assertFunction(fn, context)
      return (controller) => promiseCall(fn, original, [controller])
    }
    function convertUnderlyingSourceStartCallback(fn, original, context) {
      assertFunction(fn, context)
      return (controller) => reflectCall(fn, original, [controller])
    }
    function convertReadableStreamType(type, context) {
      type = `${type}`
      if (type !== 'bytes') {
        throw new TypeError(
          `${context} '${type}' is not a valid enumeration value for ReadableStreamType`,
        )
      }
      return type
    }
    function convertIteratorOptions(options, context) {
      assertDictionary(options, context)
      const preventCancel =
        options === null || options === undefined ? undefined : options.preventCancel
      return { preventCancel: Boolean(preventCancel) }
    }
    function convertPipeOptions(options, context) {
      assertDictionary(options, context)
      const preventAbort =
        options === null || options === undefined ? undefined : options.preventAbort
      const preventCancel =
        options === null || options === undefined ? undefined : options.preventCancel
      const preventClose =
        options === null || options === undefined ? undefined : options.preventClose
      const signal = options === null || options === undefined ? undefined : options.signal
      if (signal !== undefined) {
        assertAbortSignal(signal, `${context} has member 'signal' that`)
      }
      return {
        preventAbort: Boolean(preventAbort),
        preventCancel: Boolean(preventCancel),
        preventClose: Boolean(preventClose),
        signal,
      }
    }
    function assertAbortSignal(signal, context) {
      if (!isAbortSignal(signal)) {
        throw new TypeError(`${context} is not an AbortSignal.`)
      }
    }
    function convertReadableWritablePair(pair, context) {
      assertDictionary(pair, context)
      const readable = pair === null || pair === undefined ? undefined : pair.readable
      assertRequiredField(readable, 'readable', 'ReadableWritablePair')
      assertReadableStream(readable, `${context} has member 'readable' that`)
      const writable = pair === null || pair === undefined ? undefined : pair.writable
      assertRequiredField(writable, 'writable', 'ReadableWritablePair')
      assertWritableStream(writable, `${context} has member 'writable' that`)
      return { readable, writable }
    }

    class ReadableStream2 {
      constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
        if (rawUnderlyingSource === undefined) {
          rawUnderlyingSource = null
        } else {
          assertObject(rawUnderlyingSource, 'First parameter')
        }
        const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter')
        const underlyingSource = convertUnderlyingDefaultOrByteSource(
          rawUnderlyingSource,
          'First parameter',
        )
        InitializeReadableStream(this)
        if (underlyingSource.type === 'bytes') {
          if (strategy.size !== undefined) {
            throw new RangeError('The strategy for a byte stream cannot have a size function')
          }
          const highWaterMark = ExtractHighWaterMark(strategy, 0)
          SetUpReadableByteStreamControllerFromUnderlyingSource(
            this,
            underlyingSource,
            highWaterMark,
          )
        } else {
          const sizeAlgorithm = ExtractSizeAlgorithm(strategy)
          const highWaterMark = ExtractHighWaterMark(strategy, 1)
          SetUpReadableStreamDefaultControllerFromUnderlyingSource(
            this,
            underlyingSource,
            highWaterMark,
            sizeAlgorithm,
          )
        }
      }
      get locked() {
        if (!IsReadableStream(this)) {
          throw streamBrandCheckException$1('locked')
        }
        return IsReadableStreamLocked(this)
      }
      cancel(reason = undefined) {
        if (!IsReadableStream(this)) {
          return promiseRejectedWith(streamBrandCheckException$1('cancel'))
        }
        if (IsReadableStreamLocked(this)) {
          return promiseRejectedWith(
            new TypeError('Cannot cancel a stream that already has a reader'),
          )
        }
        return ReadableStreamCancel(this, reason)
      }
      getReader(rawOptions = undefined) {
        if (!IsReadableStream(this)) {
          throw streamBrandCheckException$1('getReader')
        }
        const options = convertReaderOptions(rawOptions, 'First parameter')
        if (options.mode === undefined) {
          return AcquireReadableStreamDefaultReader(this)
        }
        return AcquireReadableStreamBYOBReader(this)
      }
      pipeThrough(rawTransform, rawOptions = {}) {
        if (!IsReadableStream(this)) {
          throw streamBrandCheckException$1('pipeThrough')
        }
        assertRequiredArgument(rawTransform, 1, 'pipeThrough')
        const transform = convertReadableWritablePair(rawTransform, 'First parameter')
        const options = convertPipeOptions(rawOptions, 'Second parameter')
        if (IsReadableStreamLocked(this)) {
          throw new TypeError(
            'ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream',
          )
        }
        if (IsWritableStreamLocked(transform.writable)) {
          throw new TypeError(
            'ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream',
          )
        }
        const promise = ReadableStreamPipeTo(
          this,
          transform.writable,
          options.preventClose,
          options.preventAbort,
          options.preventCancel,
          options.signal,
        )
        setPromiseIsHandledToTrue(promise)
        return transform.readable
      }
      pipeTo(destination, rawOptions = {}) {
        if (!IsReadableStream(this)) {
          return promiseRejectedWith(streamBrandCheckException$1('pipeTo'))
        }
        if (destination === undefined) {
          return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`)
        }
        if (!IsWritableStream(destination)) {
          return promiseRejectedWith(
            new TypeError(
              `ReadableStream.prototype.pipeTo's first argument must be a WritableStream`,
            ),
          )
        }
        let options
        try {
          options = convertPipeOptions(rawOptions, 'Second parameter')
        } catch (e) {
          return promiseRejectedWith(e)
        }
        if (IsReadableStreamLocked(this)) {
          return promiseRejectedWith(
            new TypeError(
              'ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream',
            ),
          )
        }
        if (IsWritableStreamLocked(destination)) {
          return promiseRejectedWith(
            new TypeError(
              'ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream',
            ),
          )
        }
        return ReadableStreamPipeTo(
          this,
          destination,
          options.preventClose,
          options.preventAbort,
          options.preventCancel,
          options.signal,
        )
      }
      tee() {
        if (!IsReadableStream(this)) {
          throw streamBrandCheckException$1('tee')
        }
        const branches = ReadableStreamTee(this)
        return CreateArrayFromList(branches)
      }
      values(rawOptions = undefined) {
        if (!IsReadableStream(this)) {
          throw streamBrandCheckException$1('values')
        }
        const options = convertIteratorOptions(rawOptions, 'First parameter')
        return AcquireReadableStreamAsyncIterator(this, options.preventCancel)
      }
      [SymbolAsyncIterator](options) {
        return this.values(options)
      }
      static from(asyncIterable) {
        return ReadableStreamFrom(asyncIterable)
      }
    }
    Object.defineProperties(ReadableStream2, {
      from: { enumerable: true },
    })
    Object.defineProperties(ReadableStream2.prototype, {
      cancel: { enumerable: true },
      getReader: { enumerable: true },
      pipeThrough: { enumerable: true },
      pipeTo: { enumerable: true },
      tee: { enumerable: true },
      values: { enumerable: true },
      locked: { enumerable: true },
    })
    setFunctionName(ReadableStream2.from, 'from')
    setFunctionName(ReadableStream2.prototype.cancel, 'cancel')
    setFunctionName(ReadableStream2.prototype.getReader, 'getReader')
    setFunctionName(ReadableStream2.prototype.pipeThrough, 'pipeThrough')
    setFunctionName(ReadableStream2.prototype.pipeTo, 'pipeTo')
    setFunctionName(ReadableStream2.prototype.tee, 'tee')
    setFunctionName(ReadableStream2.prototype.values, 'values')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(ReadableStream2.prototype, Symbol.toStringTag, {
        value: 'ReadableStream',
        configurable: true,
      })
    }
    Object.defineProperty(ReadableStream2.prototype, SymbolAsyncIterator, {
      value: ReadableStream2.prototype.values,
      writable: true,
      configurable: true,
    })
    function CreateReadableStream(
      startAlgorithm,
      pullAlgorithm,
      cancelAlgorithm,
      highWaterMark = 1,
      sizeAlgorithm = () => 1,
    ) {
      const stream = Object.create(ReadableStream2.prototype)
      InitializeReadableStream(stream)
      const controller = Object.create(ReadableStreamDefaultController.prototype)
      SetUpReadableStreamDefaultController(
        stream,
        controller,
        startAlgorithm,
        pullAlgorithm,
        cancelAlgorithm,
        highWaterMark,
        sizeAlgorithm,
      )
      return stream
    }
    function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
      const stream = Object.create(ReadableStream2.prototype)
      InitializeReadableStream(stream)
      const controller = Object.create(ReadableByteStreamController.prototype)
      SetUpReadableByteStreamController(
        stream,
        controller,
        startAlgorithm,
        pullAlgorithm,
        cancelAlgorithm,
        0,
        undefined,
      )
      return stream
    }
    function InitializeReadableStream(stream) {
      stream._state = 'readable'
      stream._reader = undefined
      stream._storedError = undefined
      stream._disturbed = false
    }
    function IsReadableStream(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_readableStreamController')) {
        return false
      }
      return x instanceof ReadableStream2
    }
    function IsReadableStreamLocked(stream) {
      if (stream._reader === undefined) {
        return false
      }
      return true
    }
    function ReadableStreamCancel(stream, reason) {
      stream._disturbed = true
      if (stream._state === 'closed') {
        return promiseResolvedWith(undefined)
      }
      if (stream._state === 'errored') {
        return promiseRejectedWith(stream._storedError)
      }
      ReadableStreamClose(stream)
      const reader = stream._reader
      if (reader !== undefined && IsReadableStreamBYOBReader(reader)) {
        const readIntoRequests = reader._readIntoRequests
        reader._readIntoRequests = new SimpleQueue()
        readIntoRequests.forEach((readIntoRequest) => {
          readIntoRequest._closeSteps(undefined)
        })
      }
      const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason)
      return transformPromiseWith(sourceCancelPromise, noop)
    }
    function ReadableStreamClose(stream) {
      stream._state = 'closed'
      const reader = stream._reader
      if (reader === undefined) {
        return
      }
      defaultReaderClosedPromiseResolve(reader)
      if (IsReadableStreamDefaultReader(reader)) {
        const readRequests = reader._readRequests
        reader._readRequests = new SimpleQueue()
        readRequests.forEach((readRequest) => {
          readRequest._closeSteps()
        })
      }
    }
    function ReadableStreamError(stream, e) {
      stream._state = 'errored'
      stream._storedError = e
      const reader = stream._reader
      if (reader === undefined) {
        return
      }
      defaultReaderClosedPromiseReject(reader, e)
      if (IsReadableStreamDefaultReader(reader)) {
        ReadableStreamDefaultReaderErrorReadRequests(reader, e)
      } else {
        ReadableStreamBYOBReaderErrorReadIntoRequests(reader, e)
      }
    }
    function streamBrandCheckException$1(name) {
      return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`)
    }
    function convertQueuingStrategyInit(init, context) {
      assertDictionary(init, context)
      const highWaterMark = init === null || init === undefined ? undefined : init.highWaterMark
      assertRequiredField(highWaterMark, 'highWaterMark', 'QueuingStrategyInit')
      return {
        highWaterMark: convertUnrestrictedDouble(highWaterMark),
      }
    }
    const byteLengthSizeFunction = (chunk) => {
      return chunk.byteLength
    }
    setFunctionName(byteLengthSizeFunction, 'size')

    class ByteLengthQueuingStrategy {
      constructor(options) {
        assertRequiredArgument(options, 1, 'ByteLengthQueuingStrategy')
        options = convertQueuingStrategyInit(options, 'First parameter')
        this._byteLengthQueuingStrategyHighWaterMark = options.highWaterMark
      }
      get highWaterMark() {
        if (!IsByteLengthQueuingStrategy(this)) {
          throw byteLengthBrandCheckException('highWaterMark')
        }
        return this._byteLengthQueuingStrategyHighWaterMark
      }
      get size() {
        if (!IsByteLengthQueuingStrategy(this)) {
          throw byteLengthBrandCheckException('size')
        }
        return byteLengthSizeFunction
      }
    }
    Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
      highWaterMark: { enumerable: true },
      size: { enumerable: true },
    })
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(ByteLengthQueuingStrategy.prototype, Symbol.toStringTag, {
        value: 'ByteLengthQueuingStrategy',
        configurable: true,
      })
    }
    function byteLengthBrandCheckException(name) {
      return new TypeError(
        `ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`,
      )
    }
    function IsByteLengthQueuingStrategy(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_byteLengthQueuingStrategyHighWaterMark')) {
        return false
      }
      return x instanceof ByteLengthQueuingStrategy
    }
    const countSizeFunction = () => {
      return 1
    }
    setFunctionName(countSizeFunction, 'size')

    class CountQueuingStrategy {
      constructor(options) {
        assertRequiredArgument(options, 1, 'CountQueuingStrategy')
        options = convertQueuingStrategyInit(options, 'First parameter')
        this._countQueuingStrategyHighWaterMark = options.highWaterMark
      }
      get highWaterMark() {
        if (!IsCountQueuingStrategy(this)) {
          throw countBrandCheckException('highWaterMark')
        }
        return this._countQueuingStrategyHighWaterMark
      }
      get size() {
        if (!IsCountQueuingStrategy(this)) {
          throw countBrandCheckException('size')
        }
        return countSizeFunction
      }
    }
    Object.defineProperties(CountQueuingStrategy.prototype, {
      highWaterMark: { enumerable: true },
      size: { enumerable: true },
    })
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(CountQueuingStrategy.prototype, Symbol.toStringTag, {
        value: 'CountQueuingStrategy',
        configurable: true,
      })
    }
    function countBrandCheckException(name) {
      return new TypeError(
        `CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`,
      )
    }
    function IsCountQueuingStrategy(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_countQueuingStrategyHighWaterMark')) {
        return false
      }
      return x instanceof CountQueuingStrategy
    }
    function convertTransformer(original, context) {
      assertDictionary(original, context)
      const cancel = original === null || original === undefined ? undefined : original.cancel
      const flush = original === null || original === undefined ? undefined : original.flush
      const readableType =
        original === null || original === undefined ? undefined : original.readableType
      const start = original === null || original === undefined ? undefined : original.start
      const transform = original === null || original === undefined ? undefined : original.transform
      const writableType =
        original === null || original === undefined ? undefined : original.writableType
      return {
        cancel:
          cancel === undefined
            ? undefined
            : convertTransformerCancelCallback(
                cancel,
                original,
                `${context} has member 'cancel' that`,
              ),
        flush:
          flush === undefined
            ? undefined
            : convertTransformerFlushCallback(
                flush,
                original,
                `${context} has member 'flush' that`,
              ),
        readableType,
        start:
          start === undefined
            ? undefined
            : convertTransformerStartCallback(
                start,
                original,
                `${context} has member 'start' that`,
              ),
        transform:
          transform === undefined
            ? undefined
            : convertTransformerTransformCallback(
                transform,
                original,
                `${context} has member 'transform' that`,
              ),
        writableType,
      }
    }
    function convertTransformerFlushCallback(fn, original, context) {
      assertFunction(fn, context)
      return (controller) => promiseCall(fn, original, [controller])
    }
    function convertTransformerStartCallback(fn, original, context) {
      assertFunction(fn, context)
      return (controller) => reflectCall(fn, original, [controller])
    }
    function convertTransformerTransformCallback(fn, original, context) {
      assertFunction(fn, context)
      return (chunk, controller) => promiseCall(fn, original, [chunk, controller])
    }
    function convertTransformerCancelCallback(fn, original, context) {
      assertFunction(fn, context)
      return (reason) => promiseCall(fn, original, [reason])
    }

    class TransformStream {
      constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
        if (rawTransformer === undefined) {
          rawTransformer = null
        }
        const writableStrategy = convertQueuingStrategy(rawWritableStrategy, 'Second parameter')
        const readableStrategy = convertQueuingStrategy(rawReadableStrategy, 'Third parameter')
        const transformer = convertTransformer(rawTransformer, 'First parameter')
        if (transformer.readableType !== undefined) {
          throw new RangeError('Invalid readableType specified')
        }
        if (transformer.writableType !== undefined) {
          throw new RangeError('Invalid writableType specified')
        }
        const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0)
        const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy)
        const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1)
        const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy)
        let startPromise_resolve
        const startPromise = newPromise((resolve) => {
          startPromise_resolve = resolve
        })
        InitializeTransformStream(
          this,
          startPromise,
          writableHighWaterMark,
          writableSizeAlgorithm,
          readableHighWaterMark,
          readableSizeAlgorithm,
        )
        SetUpTransformStreamDefaultControllerFromTransformer(this, transformer)
        if (transformer.start !== undefined) {
          startPromise_resolve(transformer.start(this._transformStreamController))
        } else {
          startPromise_resolve(undefined)
        }
      }
      get readable() {
        if (!IsTransformStream(this)) {
          throw streamBrandCheckException('readable')
        }
        return this._readable
      }
      get writable() {
        if (!IsTransformStream(this)) {
          throw streamBrandCheckException('writable')
        }
        return this._writable
      }
    }
    Object.defineProperties(TransformStream.prototype, {
      readable: { enumerable: true },
      writable: { enumerable: true },
    })
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(TransformStream.prototype, Symbol.toStringTag, {
        value: 'TransformStream',
        configurable: true,
      })
    }
    function InitializeTransformStream(
      stream,
      startPromise,
      writableHighWaterMark,
      writableSizeAlgorithm,
      readableHighWaterMark,
      readableSizeAlgorithm,
    ) {
      function startAlgorithm() {
        return startPromise
      }
      function writeAlgorithm(chunk) {
        return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk)
      }
      function abortAlgorithm(reason) {
        return TransformStreamDefaultSinkAbortAlgorithm(stream, reason)
      }
      function closeAlgorithm() {
        return TransformStreamDefaultSinkCloseAlgorithm(stream)
      }
      stream._writable = CreateWritableStream(
        startAlgorithm,
        writeAlgorithm,
        closeAlgorithm,
        abortAlgorithm,
        writableHighWaterMark,
        writableSizeAlgorithm,
      )
      function pullAlgorithm() {
        return TransformStreamDefaultSourcePullAlgorithm(stream)
      }
      function cancelAlgorithm(reason) {
        return TransformStreamDefaultSourceCancelAlgorithm(stream, reason)
      }
      stream._readable = CreateReadableStream(
        startAlgorithm,
        pullAlgorithm,
        cancelAlgorithm,
        readableHighWaterMark,
        readableSizeAlgorithm,
      )
      stream._backpressure = undefined
      stream._backpressureChangePromise = undefined
      stream._backpressureChangePromise_resolve = undefined
      TransformStreamSetBackpressure(stream, true)
      stream._transformStreamController = undefined
    }
    function IsTransformStream(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_transformStreamController')) {
        return false
      }
      return x instanceof TransformStream
    }
    function TransformStreamError(stream, e) {
      ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e)
      TransformStreamErrorWritableAndUnblockWrite(stream, e)
    }
    function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
      TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController)
      WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e)
      TransformStreamUnblockWrite(stream)
    }
    function TransformStreamUnblockWrite(stream) {
      if (stream._backpressure) {
        TransformStreamSetBackpressure(stream, false)
      }
    }
    function TransformStreamSetBackpressure(stream, backpressure) {
      if (stream._backpressureChangePromise !== undefined) {
        stream._backpressureChangePromise_resolve()
      }
      stream._backpressureChangePromise = newPromise((resolve) => {
        stream._backpressureChangePromise_resolve = resolve
      })
      stream._backpressure = backpressure
    }

    class TransformStreamDefaultController {
      constructor() {
        throw new TypeError('Illegal constructor')
      }
      get desiredSize() {
        if (!IsTransformStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException('desiredSize')
        }
        const readableController =
          this._controlledTransformStream._readable._readableStreamController
        return ReadableStreamDefaultControllerGetDesiredSize(readableController)
      }
      enqueue(chunk = undefined) {
        if (!IsTransformStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException('enqueue')
        }
        TransformStreamDefaultControllerEnqueue(this, chunk)
      }
      error(reason = undefined) {
        if (!IsTransformStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException('error')
        }
        TransformStreamDefaultControllerError(this, reason)
      }
      terminate() {
        if (!IsTransformStreamDefaultController(this)) {
          throw defaultControllerBrandCheckException('terminate')
        }
        TransformStreamDefaultControllerTerminate(this)
      }
    }
    Object.defineProperties(TransformStreamDefaultController.prototype, {
      enqueue: { enumerable: true },
      error: { enumerable: true },
      terminate: { enumerable: true },
      desiredSize: { enumerable: true },
    })
    setFunctionName(TransformStreamDefaultController.prototype.enqueue, 'enqueue')
    setFunctionName(TransformStreamDefaultController.prototype.error, 'error')
    setFunctionName(TransformStreamDefaultController.prototype.terminate, 'terminate')
    if (typeof Symbol.toStringTag === 'symbol') {
      Object.defineProperty(TransformStreamDefaultController.prototype, Symbol.toStringTag, {
        value: 'TransformStreamDefaultController',
        configurable: true,
      })
    }
    function IsTransformStreamDefaultController(x) {
      if (!typeIsObject(x)) {
        return false
      }
      if (!Object.hasOwn(x, '_controlledTransformStream')) {
        return false
      }
      return x instanceof TransformStreamDefaultController
    }
    function SetUpTransformStreamDefaultController(
      stream,
      controller,
      transformAlgorithm,
      flushAlgorithm,
      cancelAlgorithm,
    ) {
      controller._controlledTransformStream = stream
      stream._transformStreamController = controller
      controller._transformAlgorithm = transformAlgorithm
      controller._flushAlgorithm = flushAlgorithm
      controller._cancelAlgorithm = cancelAlgorithm
      controller._finishPromise = undefined
      controller._finishPromise_resolve = undefined
      controller._finishPromise_reject = undefined
    }
    function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
      const controller = Object.create(TransformStreamDefaultController.prototype)
      let transformAlgorithm
      let flushAlgorithm
      let cancelAlgorithm
      if (transformer.transform !== undefined) {
        transformAlgorithm = (chunk) => transformer.transform(chunk, controller)
      } else {
        transformAlgorithm = (chunk) => {
          try {
            TransformStreamDefaultControllerEnqueue(controller, chunk)
            return promiseResolvedWith(undefined)
          } catch (transformResultE) {
            return promiseRejectedWith(transformResultE)
          }
        }
      }
      if (transformer.flush !== undefined) {
        flushAlgorithm = () => transformer.flush(controller)
      } else {
        flushAlgorithm = () => promiseResolvedWith(undefined)
      }
      if (transformer.cancel !== undefined) {
        cancelAlgorithm = (reason) => transformer.cancel(reason)
      } else {
        cancelAlgorithm = () => promiseResolvedWith(undefined)
      }
      SetUpTransformStreamDefaultController(
        stream,
        controller,
        transformAlgorithm,
        flushAlgorithm,
        cancelAlgorithm,
      )
    }
    function TransformStreamDefaultControllerClearAlgorithms(controller) {
      controller._transformAlgorithm = undefined
      controller._flushAlgorithm = undefined
      controller._cancelAlgorithm = undefined
    }
    function TransformStreamDefaultControllerEnqueue(controller, chunk) {
      const stream = controller._controlledTransformStream
      const readableController = stream._readable._readableStreamController
      if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
        throw new TypeError('Readable side is not in a state that permits enqueue')
      }
      try {
        ReadableStreamDefaultControllerEnqueue(readableController, chunk)
      } catch (e) {
        TransformStreamErrorWritableAndUnblockWrite(stream, e)
        throw stream._readable._storedError
      }
      const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController)
      if (backpressure !== stream._backpressure) {
        TransformStreamSetBackpressure(stream, true)
      }
    }
    function TransformStreamDefaultControllerError(controller, e) {
      TransformStreamError(controller._controlledTransformStream, e)
    }
    function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
      const transformPromise = controller._transformAlgorithm(chunk)
      return transformPromiseWith(transformPromise, undefined, (r) => {
        TransformStreamError(controller._controlledTransformStream, r)
        throw r
      })
    }
    function TransformStreamDefaultControllerTerminate(controller) {
      const stream = controller._controlledTransformStream
      const readableController = stream._readable._readableStreamController
      ReadableStreamDefaultControllerClose(readableController)
      const error = new TypeError('TransformStream terminated')
      TransformStreamErrorWritableAndUnblockWrite(stream, error)
    }
    function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
      const controller = stream._transformStreamController
      if (stream._backpressure) {
        const backpressureChangePromise = stream._backpressureChangePromise
        return transformPromiseWith(backpressureChangePromise, () => {
          const writable = stream._writable
          const state = writable._state
          if (state === 'erroring') {
            throw writable._storedError
          }
          return TransformStreamDefaultControllerPerformTransform(controller, chunk)
        })
      }
      return TransformStreamDefaultControllerPerformTransform(controller, chunk)
    }
    function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
      const controller = stream._transformStreamController
      if (controller._finishPromise !== undefined) {
        return controller._finishPromise
      }
      const readable = stream._readable
      controller._finishPromise = newPromise((resolve, reject) => {
        controller._finishPromise_resolve = resolve
        controller._finishPromise_reject = reject
      })
      const cancelPromise = controller._cancelAlgorithm(reason)
      TransformStreamDefaultControllerClearAlgorithms(controller)
      uponPromise(
        cancelPromise,
        () => {
          if (readable._state === 'errored') {
            defaultControllerFinishPromiseReject(controller, readable._storedError)
          } else {
            ReadableStreamDefaultControllerError(readable._readableStreamController, reason)
            defaultControllerFinishPromiseResolve(controller)
          }
          return null
        },
        (r) => {
          ReadableStreamDefaultControllerError(readable._readableStreamController, r)
          defaultControllerFinishPromiseReject(controller, r)
          return null
        },
      )
      return controller._finishPromise
    }
    function TransformStreamDefaultSinkCloseAlgorithm(stream) {
      const controller = stream._transformStreamController
      if (controller._finishPromise !== undefined) {
        return controller._finishPromise
      }
      const readable = stream._readable
      controller._finishPromise = newPromise((resolve, reject) => {
        controller._finishPromise_resolve = resolve
        controller._finishPromise_reject = reject
      })
      const flushPromise = controller._flushAlgorithm()
      TransformStreamDefaultControllerClearAlgorithms(controller)
      uponPromise(
        flushPromise,
        () => {
          if (readable._state === 'errored') {
            defaultControllerFinishPromiseReject(controller, readable._storedError)
          } else {
            ReadableStreamDefaultControllerClose(readable._readableStreamController)
            defaultControllerFinishPromiseResolve(controller)
          }
          return null
        },
        (r) => {
          ReadableStreamDefaultControllerError(readable._readableStreamController, r)
          defaultControllerFinishPromiseReject(controller, r)
          return null
        },
      )
      return controller._finishPromise
    }
    function TransformStreamDefaultSourcePullAlgorithm(stream) {
      TransformStreamSetBackpressure(stream, false)
      return stream._backpressureChangePromise
    }
    function TransformStreamDefaultSourceCancelAlgorithm(stream, reason) {
      const controller = stream._transformStreamController
      if (controller._finishPromise !== undefined) {
        return controller._finishPromise
      }
      const writable = stream._writable
      controller._finishPromise = newPromise((resolve, reject) => {
        controller._finishPromise_resolve = resolve
        controller._finishPromise_reject = reject
      })
      const cancelPromise = controller._cancelAlgorithm(reason)
      TransformStreamDefaultControllerClearAlgorithms(controller)
      uponPromise(
        cancelPromise,
        () => {
          if (writable._state === 'errored') {
            defaultControllerFinishPromiseReject(controller, writable._storedError)
          } else {
            WritableStreamDefaultControllerErrorIfNeeded(writable._writableStreamController, reason)
            TransformStreamUnblockWrite(stream)
            defaultControllerFinishPromiseResolve(controller)
          }
          return null
        },
        (r) => {
          WritableStreamDefaultControllerErrorIfNeeded(writable._writableStreamController, r)
          TransformStreamUnblockWrite(stream)
          defaultControllerFinishPromiseReject(controller, r)
          return null
        },
      )
      return controller._finishPromise
    }
    function defaultControllerBrandCheckException(name) {
      return new TypeError(
        `TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`,
      )
    }
    function defaultControllerFinishPromiseResolve(controller) {
      if (controller._finishPromise_resolve === undefined) {
        return
      }
      controller._finishPromise_resolve()
      controller._finishPromise_resolve = undefined
      controller._finishPromise_reject = undefined
    }
    function defaultControllerFinishPromiseReject(controller, reason) {
      if (controller._finishPromise_reject === undefined) {
        return
      }
      setPromiseIsHandledToTrue(controller._finishPromise)
      controller._finishPromise_reject(reason)
      controller._finishPromise_resolve = undefined
      controller._finishPromise_reject = undefined
    }
    function streamBrandCheckException(name) {
      return new TypeError(
        `TransformStream.prototype.${name} can only be used on a TransformStream`,
      )
    }
    exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy
    exports2.CountQueuingStrategy = CountQueuingStrategy
    exports2.ReadableByteStreamController = ReadableByteStreamController
    exports2.ReadableStream = ReadableStream2
    exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader
    exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest
    exports2.ReadableStreamDefaultController = ReadableStreamDefaultController
    exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader
    exports2.TransformStream = TransformStream
    exports2.TransformStreamDefaultController = TransformStreamDefaultController
    exports2.WritableStream = WritableStream
    exports2.WritableStreamDefaultController = WritableStreamDefaultController
    exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter
  })
})

// node_modules/fetch-blob/streams.cjs
const require_streams = __commonJS(() => {
  const POOL_SIZE = 65536
  if (!globalThis.ReadableStream) {
    try {
      const process2 = __require('node:process')
      const { emitWarning } = process2
      try {
        process2.emitWarning = () => {}
        Object.assign(globalThis, __require('node:stream/web'))
        process2.emitWarning = emitWarning
      } catch (error) {
        process2.emitWarning = emitWarning
        throw error
      }
    } catch (_error) {
      Object.assign(globalThis, require_ponyfill_es2018())
    }
  }
  try {
    const { Blob } = __require('buffer')
    if (Blob && !Blob.prototype.stream) {
      Blob.prototype.stream = function name(_params) {
        let position = 0
        const blob = this
        return new ReadableStream({
          type: 'bytes',
          async pull(ctrl) {
            const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE))
            const buffer = await chunk.arrayBuffer()
            position += buffer.byteLength
            ctrl.enqueue(new Uint8Array(buffer))
            if (position === blob.size) {
              ctrl.close()
            }
          },
        })
      }
    }
  } catch (_error) {}
})

// node_modules/fetch-blob/index.js
async function* toIterator(parts, clone = true) {
  for (const part of parts) {
    if ('stream' in part) {
      yield* part.stream()
    } else if (ArrayBuffer.isView(part)) {
      if (clone) {
        let position = part.byteOffset
        const end = part.byteOffset + part.byteLength
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE)
          const chunk = part.buffer.slice(position, position + size)
          position += chunk.byteLength
          yield new Uint8Array(chunk)
        }
      } else {
        yield part
      }
    } else {
      let position = 0
      const b = part
      while (position !== b.size) {
        const chunk = b.slice(position, Math.min(b.size, position + POOL_SIZE))
        const buffer = await chunk.arrayBuffer()
        position += buffer.byteLength
        yield new Uint8Array(buffer)
      }
    }
  }
}
let _import_streams
const POOL_SIZE = 65536
let _Blob
let Blob2
let fetch_blob_default
const init_fetch_blob = __esm(() => {
  _import_streams = __toESM(require_streams(), 1)
  /*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
  _Blob = class Blob {
    #parts = []
    #type = ''
    #size = 0
    #endings = 'transparent'
    constructor(blobParts = [], options = {}) {
      if (typeof blobParts !== 'object' || blobParts === null) {
        throw new TypeError(
          "Failed to construct 'Blob': The provided value cannot be converted to a sequence.",
        )
      }
      if (typeof blobParts[Symbol.iterator] !== 'function') {
        throw new TypeError(
          "Failed to construct 'Blob': The object must have a callable @@iterator property.",
        )
      }
      if (typeof options !== 'object' && typeof options !== 'function') {
        throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.")
      }
      if (options === null) {
        options = {}
      }
      const encoder = new TextEncoder()
      for (const element of blobParts) {
        let part
        if (ArrayBuffer.isView(element)) {
          part = new Uint8Array(
            element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength),
          )
        } else if (element instanceof ArrayBuffer) {
          part = new Uint8Array(element.slice(0))
        } else if (element instanceof Blob) {
          part = element
        } else {
          part = encoder.encode(`${element}`)
        }
        this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size
        this.#parts.push(part)
      }
      this.#endings = `${options.endings === undefined ? 'transparent' : options.endings}`
      const type = options.type === undefined ? '' : String(options.type)
      this.#type = /^[\x20-\x7E]*$/.test(type) ? type : ''
    }
    get size() {
      return this.#size
    }
    get type() {
      return this.#type
    }
    async text() {
      const decoder = new TextDecoder()
      let str = ''
      for await (const part of toIterator(this.#parts, false)) {
        str += decoder.decode(part, { stream: true })
      }
      str += decoder.decode()
      return str
    }
    async arrayBuffer() {
      const data = new Uint8Array(this.size)
      let offset = 0
      for await (const chunk of toIterator(this.#parts, false)) {
        data.set(chunk, offset)
        offset += chunk.length
      }
      return data.buffer
    }
    stream() {
      const it = toIterator(this.#parts, true)
      return new globalThis.ReadableStream({
        type: 'bytes',
        async pull(ctrl) {
          const chunk = await it.next()
          chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value)
        },
        async cancel() {
          await it.return()
        },
      })
    }
    slice(start = 0, end = this.size, type = '') {
      const { size } = this
      let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size)
      let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size)
      const span = Math.max(relativeEnd - relativeStart, 0)
      const parts = this.#parts
      const blobParts = []
      let added = 0
      for (const part of parts) {
        if (added >= span) {
          break
        }
        const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size
        if (relativeStart && size2 <= relativeStart) {
          relativeStart -= size2
          relativeEnd -= size2
        } else {
          let chunk
          if (ArrayBuffer.isView(part)) {
            chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd))
            added += chunk.byteLength
          } else {
            chunk = part.slice(relativeStart, Math.min(size2, relativeEnd))
            added += chunk.size
          }
          relativeEnd -= size2
          blobParts.push(chunk)
          relativeStart = 0
        }
      }
      const blob = new Blob([], { type: String(type).toLowerCase() })
      blob.#size = span
      blob.#parts = blobParts
      return blob
    }
    get [Symbol.toStringTag]() {
      return 'Blob'
    }
    static [Symbol.hasInstance](object) {
      return (
        object &&
        typeof object === 'object' &&
        typeof object.constructor === 'function' &&
        (typeof object.stream === 'function' || typeof object.arrayBuffer === 'function') &&
        /^(Blob|File)$/.test(object[Symbol.toStringTag])
      )
    }
  }
  Object.defineProperties(_Blob.prototype, {
    size: { enumerable: true },
    type: { enumerable: true },
    slice: { enumerable: true },
  })
  Blob2 = _Blob
  fetch_blob_default = Blob2
})

// node_modules/fetch-blob/file.js
let _File
let File2
let file_default
const init_file = __esm(() => {
  init_fetch_blob()
  _File = class File extends fetch_blob_default {
    #lastModified = 0
    #name = ''
    constructor(fileBits, fileName, options = {}) {
      if (arguments.length < 2) {
        throw new TypeError(
          `Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`,
        )
      }
      super(fileBits, options)
      if (options === null) {
        options = {}
      }
      const lastModified =
        options.lastModified === undefined ? Date.now() : Number(options.lastModified)
      if (!Number.isNaN(lastModified)) {
        this.#lastModified = lastModified
      }
      this.#name = String(fileName)
    }
    get name() {
      return this.#name
    }
    get lastModified() {
      return this.#lastModified
    }
    get [Symbol.toStringTag]() {
      return 'File'
    }
    static [Symbol.hasInstance](object) {
      return (
        !!object &&
        object instanceof fetch_blob_default &&
        /^(File)$/.test(object[Symbol.toStringTag])
      )
    }
  }
  File2 = _File
  file_default = File2
})

// node_modules/formdata-polyfill/esm.min.js
function formDataToBlob(F, B = fetch_blob_default) {
  const b = `${r()}${r()}`.replace(/\./g, '').slice(-28).padStart(32, '-')
  const c = []
  const p = `--${b}\r
Content-Disposition: form-data; name="`
  F.forEach((v, n) =>
    typeof v === 'string'
      ? c.push(
          p +
            e(n) +
            `"\r
\r
${v.replace(
  /\r(?!\n)|(?<!\r)\n/g,
  `\r
`,
)}\r
`,
        )
      : c.push(
          p +
            e(n) +
            `"; filename="${e(v.name, 1)}"\r
Content-Type: ${v.type || 'application/octet-stream'}\r
\r
`,
          v,
          `\r
`,
        ),
  )
  c.push(`--${b}--`)
  return new B(c, { type: `multipart/form-data; boundary=${b}` })
}
let t
let i
let h
let r
let m
const f = (a, b, c) => (
  (a += ''),
  /^(Blob|File)$/.test(b?.[t])
    ? [
        ((c = c !== undefined ? `${c}` : b[t] === 'File' ? b.name : 'blob'), a),
        b.name !== c || b[t] === 'blob' ? new file_default([b], c, b) : b,
      ]
    : [a, `${b}`]
)
const e = (c, f2) =>
  (f2
    ? c
    : c.replace(
        /\r?\n|\r/g,
        `\r
`,
      )
  )
    .replace(/\n/g, '%0A')
    .replace(/\r/g, '%0D')
    .replace(/"/g, '%22')
const x = (n, a, e2) => {
  if (a.length < e2) {
    throw new TypeError(
      `Failed to execute '${n}' on 'FormData': ${e2} arguments required, but only ${a.length} present.`,
    )
  }
}
let FormData
const init_esm_min = __esm(() => {
  init_fetch_blob()
  init_file()
  /*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
  ;({ toStringTag: t, iterator: i, hasInstance: h } = Symbol)
  r = Math.random
  m = 'append,set,get,getAll,delete,keys,values,entries,forEach,constructor'.split(',')
  FormData = class FormData2 {
    #d = []
    constructor(...a) {
      if (a.length) {
        throw new TypeError(
          `Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.`,
        )
      }
    }
    get [t]() {
      return 'FormData'
    }
    [i]() {
      return this.entries()
    }
    static [h](o) {
      return (
        o &&
        typeof o === 'object' &&
        o[t] === 'FormData' &&
        !m.some((m2) => typeof o[m2] !== 'function')
      )
    }
    append(...a) {
      x('append', arguments, 2)
      this.#d.push(f(...a))
    }
    delete(a) {
      x('delete', arguments, 1)
      a += ''
      this.#d = this.#d.filter(([b]) => b !== a)
    }
    get(a) {
      x('get', arguments, 1)
      a += ''
      for (let b = this.#d, l = b.length, c = 0; c < l; c++) {
        if (b[c][0] === a) {
          return b[c][1]
        }
      }
      return null
    }
    getAll(a, b) {
      x('getAll', arguments, 1)
      b = []
      a += ''
      this.#d.forEach((c) => c[0] === a && b.push(c[1]))
      return b
    }
    has(a) {
      x('has', arguments, 1)
      a += ''
      return this.#d.some((b) => b[0] === a)
    }
    forEach(a, b) {
      x('forEach', arguments, 1)
      for (const [c, d] of this) {
        a.call(b, d, c, this)
      }
    }
    set(...a) {
      x('set', arguments, 2)
      const b = []
      let c = true
      a = f(...a)
      this.#d.forEach((d) => {
        d[0] === a[0] ? c && (c = !b.push(a)) : b.push(d)
      })
      c && b.push(a)
      this.#d = b
    }
    *entries() {
      yield* this.#d
    }
    *keys() {
      for (const [a] of this) {
        yield a
      }
    }
    *values() {
      for (const [, a] of this) {
        yield a
      }
    }
  }
})

// node_modules/node-domexception/index.js
const require_node_domexception = __commonJS((_exports, module) => {
  /*! node-domexception. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
  if (!globalThis.DOMException) {
    try {
      const { MessageChannel } = __require('worker_threads')
      const port = new MessageChannel().port1
      const ab = new ArrayBuffer()
      port.postMessage(ab, [ab, ab])
    } catch (err) {
      err.constructor.name === 'DOMException' && (globalThis.DOMException = err.constructor)
    }
  }
  module.exports = globalThis.DOMException
})

// node_modules/fetch-blob/from.js
import { createReadStream, promises as fs } from 'node:fs'

let import_node_domexception
let stat
let _BlobDataItem
const init_from = __esm(() => {
  import_node_domexception = __toESM(require_node_domexception(), 1)
  init_file()
  init_fetch_blob()
  ;({ stat } = fs)
  _BlobDataItem = class BlobDataItem {
    #path
    #start
    constructor(options) {
      this.#path = options.path
      this.#start = options.start
      this.size = options.size
      this.lastModified = options.lastModified
    }
    slice(start, end) {
      return new BlobDataItem({
        path: this.#path,
        lastModified: this.lastModified,
        size: end - start,
        start: this.#start + start,
      })
    }
    async *stream() {
      const { mtimeMs } = await stat(this.#path)
      if (mtimeMs > this.lastModified) {
        throw new import_node_domexception.default(
          'The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.',
          'NotReadableError',
        )
      }
      yield* createReadStream(this.#path, {
        start: this.#start,
        end: this.#start + this.size - 1,
      })
    }
    get [Symbol.toStringTag]() {
      return 'Blob'
    }
  }
})

// node_modules/node-fetch/src/utils/multipart-parser.js
const exports_multipart_parser = {}
__export(exports_multipart_parser, {
  toFormData: () => toFormData,
})

class MultipartParser {
  constructor(boundary) {
    this.index = 0
    this.flags = 0
    this.onHeaderEnd = noop
    this.onHeaderField = noop
    this.onHeadersEnd = noop
    this.onHeaderValue = noop
    this.onPartBegin = noop
    this.onPartData = noop
    this.onPartEnd = noop
    this.boundaryChars = {}
    boundary = `\r
--${boundary}`
    const ui8a = new Uint8Array(boundary.length)
    for (let i2 = 0; i2 < boundary.length; i2++) {
      ui8a[i2] = boundary.charCodeAt(i2)
      this.boundaryChars[ui8a[i2]] = true
    }
    this.boundary = ui8a
    this.lookbehind = new Uint8Array(this.boundary.length + 8)
    this.state = S.START_BOUNDARY
  }
  write(data) {
    let i2 = 0
    const length_ = data.length
    let previousIndex = this.index
    let { lookbehind, boundary, boundaryChars, index, state, flags } = this
    const boundaryLength = this.boundary.length
    const boundaryEnd = boundaryLength - 1
    const bufferLength = data.length
    let c
    let cl
    const mark = (name) => {
      this[`${name}Mark`] = i2
    }
    const clear = (name) => {
      delete this[`${name}Mark`]
    }
    const callback = (callbackSymbol, start, end, ui8a) => {
      if (start === undefined || start !== end) {
        this[callbackSymbol](ui8a?.subarray(start, end))
      }
    }
    const dataCallback = (name, clear2) => {
      const markSymbol = `${name}Mark`
      if (!(markSymbol in this)) {
        return
      }
      if (clear2) {
        callback(name, this[markSymbol], i2, data)
        delete this[markSymbol]
      } else {
        callback(name, this[markSymbol], data.length, data)
        this[markSymbol] = 0
      }
    }
    for (i2 = 0; i2 < length_; i2++) {
      c = data[i2]
      switch (state) {
        case S.START_BOUNDARY:
          if (index === boundary.length - 2) {
            if (c === HYPHEN) {
              flags |= F.LAST_BOUNDARY
            } else if (c !== CR) {
              return
            }
            index++
            break
          }
          if (index - 1 === boundary.length - 2) {
            if (flags & F.LAST_BOUNDARY && c === HYPHEN) {
              state = S.END
              flags = 0
            } else if (!(flags & F.LAST_BOUNDARY) && c === LF) {
              index = 0
              callback('onPartBegin')
              state = S.HEADER_FIELD_START
            } else {
              return
            }
            break
          }
          if (c !== boundary[index + 2]) {
            index = -2
          }
          if (c === boundary[index + 2]) {
            index++
          }
          break
        case S.HEADER_FIELD_START:
          state = S.HEADER_FIELD
          mark('onHeaderField')
          index = 0
        case S.HEADER_FIELD:
          if (c === CR) {
            clear('onHeaderField')
            state = S.HEADERS_ALMOST_DONE
            break
          }
          index++
          if (c === HYPHEN) {
            break
          }
          if (c === COLON) {
            if (index === 1) {
              return
            }
            dataCallback('onHeaderField', true)
            state = S.HEADER_VALUE_START
            break
          }
          cl = lower(c)
          if (cl < A || cl > Z) {
            return
          }
          break
        case S.HEADER_VALUE_START:
          if (c === SPACE) {
            break
          }
          mark('onHeaderValue')
          state = S.HEADER_VALUE
        case S.HEADER_VALUE:
          if (c === CR) {
            dataCallback('onHeaderValue', true)
            callback('onHeaderEnd')
            state = S.HEADER_VALUE_ALMOST_DONE
          }
          break
        case S.HEADER_VALUE_ALMOST_DONE:
          if (c !== LF) {
            return
          }
          state = S.HEADER_FIELD_START
          break
        case S.HEADERS_ALMOST_DONE:
          if (c !== LF) {
            return
          }
          callback('onHeadersEnd')
          state = S.PART_DATA_START
          break
        case S.PART_DATA_START:
          state = S.PART_DATA
          mark('onPartData')
        case S.PART_DATA:
          previousIndex = index
          if (index === 0) {
            i2 += boundaryEnd
            while (i2 < bufferLength && !(data[i2] in boundaryChars)) {
              i2 += boundaryLength
            }
            i2 -= boundaryEnd
            c = data[i2]
          }
          if (index < boundary.length) {
            if (boundary[index] === c) {
              if (index === 0) {
                dataCallback('onPartData', true)
              }
              index++
            } else {
              index = 0
            }
          } else if (index === boundary.length) {
            index++
            if (c === CR) {
              flags |= F.PART_BOUNDARY
            } else if (c === HYPHEN) {
              flags |= F.LAST_BOUNDARY
            } else {
              index = 0
            }
          } else if (index - 1 === boundary.length) {
            if (flags & F.PART_BOUNDARY) {
              index = 0
              if (c === LF) {
                flags &= ~F.PART_BOUNDARY
                callback('onPartEnd')
                callback('onPartBegin')
                state = S.HEADER_FIELD_START
                break
              }
            } else if (flags & F.LAST_BOUNDARY) {
              if (c === HYPHEN) {
                callback('onPartEnd')
                state = S.END
                flags = 0
              } else {
                index = 0
              }
            } else {
              index = 0
            }
          }
          if (index > 0) {
            lookbehind[index - 1] = c
          } else if (previousIndex > 0) {
            const _lookbehind = new Uint8Array(
              lookbehind.buffer,
              lookbehind.byteOffset,
              lookbehind.byteLength,
            )
            callback('onPartData', 0, previousIndex, _lookbehind)
            previousIndex = 0
            mark('onPartData')
            i2--
          }
          break
        case S.END:
          break
        default:
          throw new Error(`Unexpected state entered: ${state}`)
      }
    }
    dataCallback('onHeaderField')
    dataCallback('onHeaderValue')
    dataCallback('onPartData')
    this.index = index
    this.state = state
    this.flags = flags
  }
  end() {
    if (
      (this.state === S.HEADER_FIELD_START && this.index === 0) ||
      (this.state === S.PART_DATA && this.index === this.boundary.length)
    ) {
      this.onPartEnd()
    } else if (this.state !== S.END) {
      throw new Error('MultipartParser.end(): stream ended unexpectedly')
    }
  }
}
function _fileName(headerValue) {
  const m2 = headerValue.match(/\bfilename=("(.*?)"|([^()<>@,;:\\"/[\]?={}\s\t]+))($|;\s)/i)
  if (!m2) {
    return
  }
  const match = m2[2] || m2[3] || ''
  let filename = match.slice(match.lastIndexOf('\\') + 1)
  filename = filename.replace(/%22/g, '"')
  filename = filename.replace(/&#(\d{4});/g, (_m3, code) => {
    return String.fromCharCode(code)
  })
  return filename
}
async function toFormData(Body, ct) {
  if (!/multipart/i.test(ct)) {
    throw new TypeError('Failed to fetch')
  }
  const m2 = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!m2) {
    throw new TypeError('no or bad content-type header, no multipart boundary')
  }
  const parser = new MultipartParser(m2[1] || m2[2])
  let headerField
  let headerValue
  let entryValue
  let entryName
  let contentType
  let filename
  const entryChunks = []
  const formData = new FormData()
  const onPartData = (ui8a) => {
    entryValue += decoder.decode(ui8a, { stream: true })
  }
  const appendToFile = (ui8a) => {
    entryChunks.push(ui8a)
  }
  const appendFileToFormData = () => {
    const file = new file_default(entryChunks, filename, { type: contentType })
    formData.append(entryName, file)
  }
  const appendEntryToFormData = () => {
    formData.append(entryName, entryValue)
  }
  const decoder = new TextDecoder('utf-8')
  decoder.decode()
  parser.onPartBegin = () => {
    parser.onPartData = onPartData
    parser.onPartEnd = appendEntryToFormData
    headerField = ''
    headerValue = ''
    entryValue = ''
    entryName = ''
    contentType = ''
    filename = null
    entryChunks.length = 0
  }
  parser.onHeaderField = (ui8a) => {
    headerField += decoder.decode(ui8a, { stream: true })
  }
  parser.onHeaderValue = (ui8a) => {
    headerValue += decoder.decode(ui8a, { stream: true })
  }
  parser.onHeaderEnd = () => {
    headerValue += decoder.decode()
    headerField = headerField.toLowerCase()
    if (headerField === 'content-disposition') {
      const m3 = headerValue.match(/\bname=("([^"]*)"|([^()<>@,;:\\"/[\]?={}\s\t]+))/i)
      if (m3) {
        entryName = m3[2] || m3[3] || ''
      }
      filename = _fileName(headerValue)
      if (filename) {
        parser.onPartData = appendToFile
        parser.onPartEnd = appendFileToFormData
      }
    } else if (headerField === 'content-type') {
      contentType = headerValue
    }
    headerValue = ''
    headerField = ''
  }
  for await (const chunk of Body) {
    parser.write(chunk)
  }
  parser.end()
  return formData
}
let s = 0
let S
let f2 = 1
let F
const LF = 10
const CR = 13
const SPACE = 32
const HYPHEN = 45
const COLON = 58
const A = 97
const Z = 122
const lower = (c) => c | 32
const noop = () => {}
const init_multipart_parser = __esm(() => {
  init_from()
  init_esm_min()
  S = {
    START_BOUNDARY: s++,
    HEADER_FIELD_START: s++,
    HEADER_FIELD: s++,
    HEADER_VALUE_START: s++,
    HEADER_VALUE: s++,
    HEADER_VALUE_ALMOST_DONE: s++,
    HEADERS_ALMOST_DONE: s++,
    PART_DATA_START: s++,
    PART_DATA: s++,
    END: s++,
  }
  F = {
    PART_BOUNDARY: f2,
    LAST_BOUNDARY: (f2 *= 2),
  }
})

// node_modules/cli-table3/src/debug.js
const require_debug = __commonJS((_exports, module) => {
  let messages = []
  let level = 0
  const debug = (msg, min) => {
    if (level >= min) {
      messages.push(msg)
    }
  }
  debug.WARN = 1
  debug.INFO = 2
  debug.DEBUG = 3
  debug.reset = () => {
    messages = []
  }
  debug.setDebugLevel = (v) => {
    level = v
  }
  debug.warn = (msg) => debug(msg, debug.WARN)
  debug.info = (msg) => debug(msg, debug.INFO)
  debug.debug = (msg) => debug(msg, debug.DEBUG)
  debug.debugMessages = () => messages
  module.exports = debug
})

// node_modules/ansi-regex/index.js
const require_ansi_regex = __commonJS((_exports, module) => {
  module.exports = ({ onlyFirst = false } = {}) => {
    const pattern = [
      '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
      '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
    ].join('|')
    return new RegExp(pattern, onlyFirst ? undefined : 'g')
  }
})

// node_modules/strip-ansi/index.js
const require_strip_ansi = __commonJS((_exports, module) => {
  const ansiRegex = require_ansi_regex()
  module.exports = (string) =>
    typeof string === 'string' ? string.replace(ansiRegex(), '') : string
})

// node_modules/is-fullwidth-code-point/index.js
const require_is_fullwidth_code_point = __commonJS((_exports, module) => {
  const isFullwidthCodePoint = (codePoint) => {
    if (Number.isNaN(codePoint)) {
      return false
    }
    if (
      codePoint >= 4352 &&
      (codePoint <= 4447 ||
        codePoint === 9001 ||
        codePoint === 9002 ||
        (11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351) ||
        (12880 <= codePoint && codePoint <= 19903) ||
        (19968 <= codePoint && codePoint <= 42182) ||
        (43360 <= codePoint && codePoint <= 43388) ||
        (44032 <= codePoint && codePoint <= 55203) ||
        (63744 <= codePoint && codePoint <= 64255) ||
        (65040 <= codePoint && codePoint <= 65049) ||
        (65072 <= codePoint && codePoint <= 65131) ||
        (65281 <= codePoint && codePoint <= 65376) ||
        (65504 <= codePoint && codePoint <= 65510) ||
        (110592 <= codePoint && codePoint <= 110593) ||
        (127488 <= codePoint && codePoint <= 127569) ||
        (131072 <= codePoint && codePoint <= 262141))
    ) {
      return true
    }
    return false
  }
  module.exports = isFullwidthCodePoint
  module.exports.default = isFullwidthCodePoint
})

// node_modules/emoji-regex/index.js
const require_emoji_regex = __commonJS((_exports, module) => {
  module.exports = () =>
    /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g
})

// node_modules/string-width/index.js
const require_string_width = __commonJS((_exports, module) => {
  const stripAnsi = require_strip_ansi()
  const isFullwidthCodePoint = require_is_fullwidth_code_point()
  const emojiRegex = require_emoji_regex()
  const stringWidth = (string) => {
    if (typeof string !== 'string' || string.length === 0) {
      return 0
    }
    string = stripAnsi(string)
    if (string.length === 0) {
      return 0
    }
    string = string.replace(emojiRegex(), '  ')
    let width = 0
    for (let i2 = 0; i2 < string.length; i2++) {
      const code = string.codePointAt(i2)
      if (code <= 31 || (code >= 127 && code <= 159)) {
        continue
      }
      if (code >= 768 && code <= 879) {
        continue
      }
      if (code > 65535) {
        i2++
      }
      width += isFullwidthCodePoint(code) ? 2 : 1
    }
    return width
  }
  module.exports = stringWidth
  module.exports.default = stringWidth
})

// node_modules/cli-table3/src/utils.js
const require_utils = __commonJS((_exports, module) => {
  const stringWidth = require_string_width()
  function codeRegex(capture) {
    return capture ? /\u001b\[((?:\d*;){0,5}\d*)m/g : /\u001b\[(?:\d*;){0,5}\d*m/g
  }
  function strlen(str) {
    const code = codeRegex()
    const stripped = `${str}`.replace(code, '')
    const split = stripped.split(`
`)
    return split.reduce((memo, s2) => (stringWidth(s2) > memo ? stringWidth(s2) : memo), 0)
  }
  function repeat(str, times) {
    return Array(times + 1).join(str)
  }
  function pad(str, len, pad2, dir) {
    const length = strlen(str)
    if (len + 1 >= length) {
      const padlen = len - length
      switch (dir) {
        case 'right': {
          str = repeat(pad2, padlen) + str
          break
        }
        case 'center': {
          const right = Math.ceil(padlen / 2)
          const left = padlen - right
          str = repeat(pad2, left) + str + repeat(pad2, right)
          break
        }
        default: {
          str = str + repeat(pad2, padlen)
          break
        }
      }
    }
    return str
  }
  const codeCache = {}
  function addToCodeCache(name, on, off) {
    on = `\x1B[${on}m`
    off = `\x1B[${off}m`
    codeCache[on] = { set: name, to: true }
    codeCache[off] = { set: name, to: false }
    codeCache[name] = { on, off }
  }
  addToCodeCache('bold', 1, 22)
  addToCodeCache('italics', 3, 23)
  addToCodeCache('underline', 4, 24)
  addToCodeCache('inverse', 7, 27)
  addToCodeCache('strikethrough', 9, 29)
  function updateState(state, controlChars) {
    const controlCode = controlChars[1] ? Number.parseInt(controlChars[1].split(';')[0], 10) : 0
    if ((controlCode >= 30 && controlCode <= 39) || (controlCode >= 90 && controlCode <= 97)) {
      state.lastForegroundAdded = controlChars[0]
      return
    }
    if ((controlCode >= 40 && controlCode <= 49) || (controlCode >= 100 && controlCode <= 107)) {
      state.lastBackgroundAdded = controlChars[0]
      return
    }
    if (controlCode === 0) {
      for (const i2 in state) {
        if (Object.hasOwn(state, i2)) {
          delete state[i2]
        }
      }
      return
    }
    const info = codeCache[controlChars[0]]
    if (info) {
      state[info.set] = info.to
    }
  }
  function readState(line) {
    const code = codeRegex(true)
    let controlChars = code.exec(line)
    const state = {}
    while (controlChars !== null) {
      updateState(state, controlChars)
      controlChars = code.exec(line)
    }
    return state
  }
  function unwindState(state, ret) {
    const lastBackgroundAdded = state.lastBackgroundAdded
    const lastForegroundAdded = state.lastForegroundAdded
    delete state.lastBackgroundAdded
    delete state.lastForegroundAdded
    Object.keys(state).forEach((key) => {
      if (state[key]) {
        ret += codeCache[key].off
      }
    })
    if (lastBackgroundAdded && lastBackgroundAdded !== '\x1B[49m') {
      ret += '\x1B[49m'
    }
    if (lastForegroundAdded && lastForegroundAdded !== '\x1B[39m') {
      ret += '\x1B[39m'
    }
    return ret
  }
  function rewindState(state, ret) {
    const lastBackgroundAdded = state.lastBackgroundAdded
    const lastForegroundAdded = state.lastForegroundAdded
    delete state.lastBackgroundAdded
    delete state.lastForegroundAdded
    Object.keys(state).forEach((key) => {
      if (state[key]) {
        ret = codeCache[key].on + ret
      }
    })
    if (lastBackgroundAdded && lastBackgroundAdded !== '\x1B[49m') {
      ret = lastBackgroundAdded + ret
    }
    if (lastForegroundAdded && lastForegroundAdded !== '\x1B[39m') {
      ret = lastForegroundAdded + ret
    }
    return ret
  }
  function truncateWidth(str, desiredLength) {
    if (str.length === strlen(str)) {
      return str.substr(0, desiredLength)
    }
    while (strlen(str) > desiredLength) {
      str = str.slice(0, -1)
    }
    return str
  }
  function truncateWidthWithAnsi(str, desiredLength) {
    const code = codeRegex(true)
    const split = str.split(codeRegex())
    let splitIndex = 0
    let retLen = 0
    let ret = ''
    let myArray
    const state = {}
    while (retLen < desiredLength) {
      myArray = code.exec(str)
      let toAdd = split[splitIndex]
      splitIndex++
      if (retLen + strlen(toAdd) > desiredLength) {
        toAdd = truncateWidth(toAdd, desiredLength - retLen)
      }
      ret += toAdd
      retLen += strlen(toAdd)
      if (retLen < desiredLength) {
        if (!myArray) {
          break
        }
        ret += myArray[0]
        updateState(state, myArray)
      }
    }
    return unwindState(state, ret)
  }
  function truncate(str, desiredLength, truncateChar) {
    truncateChar = truncateChar || '…'
    const lengthOfStr = strlen(str)
    if (lengthOfStr <= desiredLength) {
      return str
    }
    desiredLength -= strlen(truncateChar)
    let ret = truncateWidthWithAnsi(str, desiredLength)
    ret += truncateChar
    const hrefTag = '\x1B]8;;\x07'
    if (str.includes(hrefTag) && !ret.includes(hrefTag)) {
      ret += hrefTag
    }
    return ret
  }
  function defaultOptions() {
    return {
      chars: {
        top: '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        bottom: '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        left: '│',
        'left-mid': '├',
        mid: '─',
        'mid-mid': '┼',
        right: '│',
        'right-mid': '┤',
        middle: '│',
      },
      truncate: '…',
      colWidths: [],
      rowHeights: [],
      colAligns: [],
      rowAligns: [],
      style: {
        'padding-left': 1,
        'padding-right': 1,
        head: ['red'],
        border: ['grey'],
        compact: false,
      },
      head: [],
    }
  }
  function mergeOptions(options, defaults) {
    options = options || {}
    defaults = defaults || defaultOptions()
    const ret = Object.assign({}, defaults, options)
    ret.chars = Object.assign({}, defaults.chars, options.chars)
    ret.style = Object.assign({}, defaults.style, options.style)
    return ret
  }
  function wordWrap(maxLength, input) {
    const lines = []
    const split = input.split(/(\s+)/g)
    let line = []
    let lineLength = 0
    let whitespace
    for (let i2 = 0; i2 < split.length; i2 += 2) {
      const word = split[i2]
      let newLength = lineLength + strlen(word)
      if (lineLength > 0 && whitespace) {
        newLength += whitespace.length
      }
      if (newLength > maxLength) {
        if (lineLength !== 0) {
          lines.push(line.join(''))
        }
        line = [word]
        lineLength = strlen(word)
      } else {
        line.push(whitespace || '', word)
        lineLength = newLength
      }
      whitespace = split[i2 + 1]
    }
    if (lineLength) {
      lines.push(line.join(''))
    }
    return lines
  }
  function textWrap(maxLength, input) {
    const lines = []
    let line = ''
    function pushLine(str, ws) {
      if (line.length && ws) {
        line += ws
      }
      line += str
      while (line.length > maxLength) {
        lines.push(line.slice(0, maxLength))
        line = line.slice(maxLength)
      }
    }
    const split = input.split(/(\s+)/g)
    for (let i2 = 0; i2 < split.length; i2 += 2) {
      pushLine(split[i2], i2 && split[i2 - 1])
    }
    if (line.length) {
      lines.push(line)
    }
    return lines
  }
  function multiLineWordWrap(maxLength, input, wrapOnWordBoundary = true) {
    const output = []
    input = input.split(`
`)
    const handler = wrapOnWordBoundary ? wordWrap : textWrap
    for (let i2 = 0; i2 < input.length; i2++) {
      output.push.apply(output, handler(maxLength, input[i2]))
    }
    return output
  }
  function colorizeLines(input) {
    let state = {}
    const output = []
    for (let i2 = 0; i2 < input.length; i2++) {
      const line = rewindState(state, input[i2])
      state = readState(line)
      const temp = Object.assign({}, state)
      output.push(unwindState(temp, line))
    }
    return output
  }
  function hyperlink(url, text) {
    const OSC = '\x1B]'
    const BEL = '\x07'
    const SEP = ';'
    return [OSC, '8', SEP, SEP, url || text, BEL, text, OSC, '8', SEP, SEP, BEL].join('')
  }
  module.exports = {
    strlen,
    repeat,
    pad,
    truncate,
    mergeOptions,
    wordWrap: multiLineWordWrap,
    colorizeLines,
    hyperlink,
  }
})

// node_modules/@colors/colors/lib/styles.js
const require_styles = __commonJS((_exports, module) => {
  const styles = {}
  module.exports = styles
  const codes = {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    gray: [90, 39],
    grey: [90, 39],
    brightRed: [91, 39],
    brightGreen: [92, 39],
    brightYellow: [93, 39],
    brightBlue: [94, 39],
    brightMagenta: [95, 39],
    brightCyan: [96, 39],
    brightWhite: [97, 39],
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgBrightRed: [101, 49],
    bgBrightGreen: [102, 49],
    bgBrightYellow: [103, 49],
    bgBrightBlue: [104, 49],
    bgBrightMagenta: [105, 49],
    bgBrightCyan: [106, 49],
    bgBrightWhite: [107, 49],
    blackBG: [40, 49],
    redBG: [41, 49],
    greenBG: [42, 49],
    yellowBG: [43, 49],
    blueBG: [44, 49],
    magentaBG: [45, 49],
    cyanBG: [46, 49],
    whiteBG: [47, 49],
  }
  Object.keys(codes).forEach((key) => {
    const val = codes[key]
    const style = (styles[key] = [])
    style.open = `\x1B[${val[0]}m`
    style.close = `\x1B[${val[1]}m`
  })
})

// node_modules/@colors/colors/lib/system/has-flag.js
const require_has_flag = __commonJS((_exports, module) => {
  module.exports = (flag, argv) => {
    argv = argv || process.argv
    const terminatorPos = argv.indexOf('--')
    const prefix = /^-{1,2}/.test(flag) ? '' : '--'
    const pos = argv.indexOf(prefix + flag)
    return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos)
  }
})

// node_modules/@colors/colors/lib/system/supports-colors.js
const require_supports_colors = __commonJS((_exports, module) => {
  const os = __require('os')
  const hasFlag = require_has_flag()
  const env = process.env
  let forceColor
  if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false')) {
    forceColor = false
  } else if (
    hasFlag('color') ||
    hasFlag('colors') ||
    hasFlag('color=true') ||
    hasFlag('color=always')
  ) {
    forceColor = true
  }
  if ('FORCE_COLOR' in env) {
    forceColor = env.FORCE_COLOR.length === 0 || Number.parseInt(env.FORCE_COLOR, 10) !== 0
  }
  function translateLevel(level) {
    if (level === 0) {
      return false
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3,
    }
  }
  function supportsColor(stream) {
    if (forceColor === false) {
      return 0
    }
    if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) {
      return 3
    }
    if (hasFlag('color=256')) {
      return 2
    }
    if (stream && !stream.isTTY && forceColor !== true) {
      return 0
    }
    const min = forceColor ? 1 : 0
    if (process.platform === 'win32') {
      const osRelease = os.release().split('.')
      if (
        Number(process.versions.node.split('.')[0]) >= 8 &&
        Number(osRelease[0]) >= 10 &&
        Number(osRelease[2]) >= 10586
      ) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2
      }
      return 1
    }
    if ('CI' in env) {
      if (
        ['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some((sign) => sign in env) ||
        env.CI_NAME === 'codeship'
      ) {
        return 1
      }
      return min
    }
    if ('TEAMCITY_VERSION' in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0
    }
    if ('TERM_PROGRAM' in env) {
      const version = Number.parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10)
      switch (env.TERM_PROGRAM) {
        case 'iTerm.app':
          return version >= 3 ? 3 : 2
        case 'Hyper':
          return 3
        case 'Apple_Terminal':
          return 2
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2
    }
    if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1
    }
    if ('COLORTERM' in env) {
      return 1
    }
    if (env.TERM === 'dumb') {
      return min
    }
    return min
  }
  function getSupportLevel(stream) {
    const level = supportsColor(stream)
    return translateLevel(level)
  }
  module.exports = {
    supportsColor: getSupportLevel,
    stdout: getSupportLevel(process.stdout),
    stderr: getSupportLevel(process.stderr),
  }
})

// node_modules/@colors/colors/lib/custom/trap.js
const require_trap = __commonJS((_exports, module) => {
  module.exports = function runTheTrap(text, _options) {
    let result = ''
    text = text || 'Run the trap, drop the bass'
    text = text.split('')
    const trap = {
      a: ['@', 'Ą', 'Ⱥ', 'Ʌ', 'Δ', 'Λ', 'Д'],
      b: ['ß', 'Ɓ', 'Ƀ', 'ɮ', 'β', '฿'],
      c: ['©', 'Ȼ', 'Ͼ'],
      d: ['Ð', 'Ɗ', 'Ԁ', 'ԁ', 'Ԃ', 'ԃ'],
      e: ['Ë', 'ĕ', 'Ǝ', 'ɘ', 'Σ', 'ξ', 'Ҽ', '੬'],
      f: ['Ӻ'],
      g: ['ɢ'],
      h: ['Ħ', 'ƕ', 'Ң', 'Һ', 'Ӈ', 'Ԋ'],
      i: ['༏'],
      j: ['Ĵ'],
      k: ['ĸ', 'Ҡ', 'Ӄ', 'Ԟ'],
      l: ['Ĺ'],
      m: ['ʍ', 'Ӎ', 'ӎ', 'Ԡ', 'ԡ', '൩'],
      n: ['Ñ', 'ŋ', 'Ɲ', 'Ͷ', 'Π', 'Ҋ'],
      o: ['Ø', 'õ', 'ø', 'Ǿ', 'ʘ', 'Ѻ', 'ם', '۝', '๏'],
      p: ['Ƿ', 'Ҏ'],
      q: ['্'],
      r: ['®', 'Ʀ', 'Ȑ', 'Ɍ', 'ʀ', 'Я'],
      s: ['§', 'Ϟ', 'ϟ', 'Ϩ'],
      t: ['Ł', 'Ŧ', 'ͳ'],
      u: ['Ʊ', 'Ս'],
      v: ['ט'],
      w: ['Ш', 'Ѡ', 'Ѽ', '൰'],
      x: ['Ҳ', 'Ӿ', 'Ӽ', 'ӽ'],
      y: ['¥', 'Ұ', 'Ӌ'],
      z: ['Ƶ', 'ɀ'],
    }
    text.forEach((c) => {
      c = c.toLowerCase()
      const chars = trap[c] || [' ']
      const rand = Math.floor(Math.random() * chars.length)
      if (typeof trap[c] !== 'undefined') {
        result += trap[c][rand]
      } else {
        result += c
      }
    })
    return result
  }
})

// node_modules/@colors/colors/lib/custom/zalgo.js
const require_zalgo = __commonJS((_exports, module) => {
  module.exports = function zalgo(text, options) {
    text = text || '   he is here   '
    const soul = {
      up: [
        '̍',
        '̎',
        '̄',
        '̅',
        '̿',
        '̑',
        '̆',
        '̐',
        '͒',
        '͗',
        '͑',
        '̇',
        '̈',
        '̊',
        '͂',
        '̓',
        '̈',
        '͊',
        '͋',
        '͌',
        '̃',
        '̂',
        '̌',
        '͐',
        '̀',
        '́',
        '̋',
        '̏',
        '̒',
        '̓',
        '̔',
        '̽',
        '̉',
        'ͣ',
        'ͤ',
        'ͥ',
        'ͦ',
        'ͧ',
        'ͨ',
        'ͩ',
        'ͪ',
        'ͫ',
        'ͬ',
        'ͭ',
        'ͮ',
        'ͯ',
        '̾',
        '͛',
        '͆',
        '̚',
      ],
      down: [
        '̖',
        '̗',
        '̘',
        '̙',
        '̜',
        '̝',
        '̞',
        '̟',
        '̠',
        '̤',
        '̥',
        '̦',
        '̩',
        '̪',
        '̫',
        '̬',
        '̭',
        '̮',
        '̯',
        '̰',
        '̱',
        '̲',
        '̳',
        '̹',
        '̺',
        '̻',
        '̼',
        'ͅ',
        '͇',
        '͈',
        '͉',
        '͍',
        '͎',
        '͓',
        '͔',
        '͕',
        '͖',
        '͙',
        '͚',
        '̣',
      ],
      mid: [
        '̕',
        '̛',
        '̀',
        '́',
        '͘',
        '̡',
        '̢',
        '̧',
        '̨',
        '̴',
        '̵',
        '̶',
        '͜',
        '͝',
        '͞',
        '͟',
        '͠',
        '͢',
        '̸',
        '̷',
        '͡',
        ' ҉',
      ],
    }
    const all = [].concat(soul.up, soul.down, soul.mid)
    function randomNumber(range) {
      const r2 = Math.floor(Math.random() * range)
      return r2
    }
    function isChar(character) {
      let bool = false
      all.filter((i2) => {
        bool = i2 === character
      })
      return bool
    }
    function heComes(text2, options2) {
      let result = ''
      let counts
      let l
      options2 = options2 || {}
      options2.up = typeof options2.up !== 'undefined' ? options2.up : true
      options2.mid = typeof options2.mid !== 'undefined' ? options2.mid : true
      options2.down = typeof options2.down !== 'undefined' ? options2.down : true
      options2.size = typeof options2.size !== 'undefined' ? options2.size : 'maxi'
      text2 = text2.split('')
      for (l in text2) {
        if (isChar(l)) {
          continue
        }
        result = result + text2[l]
        counts = { up: 0, down: 0, mid: 0 }
        switch (options2.size) {
          case 'mini':
            counts.up = randomNumber(8)
            counts.mid = randomNumber(2)
            counts.down = randomNumber(8)
            break
          case 'maxi':
            counts.up = randomNumber(16) + 3
            counts.mid = randomNumber(4) + 1
            counts.down = randomNumber(64) + 3
            break
          default:
            counts.up = randomNumber(8) + 1
            counts.mid = randomNumber(6) / 2
            counts.down = randomNumber(8) + 1
            break
        }
        const arr = ['up', 'mid', 'down']
        for (const d in arr) {
          const index = arr[d]
          for (let i2 = 0; i2 <= counts[index]; i2++) {
            if (options2[index]) {
              result = result + soul[index][randomNumber(soul[index].length)]
            }
          }
        }
      }
      return result
    }
    return heComes(text, options)
  }
})

// node_modules/@colors/colors/lib/maps/america.js
const require_america = __commonJS((_exports, module) => {
  module.exports = (colors) => (letter, i2, _exploded) => {
    if (letter === ' ') {
      return letter
    }
    switch (i2 % 3) {
      case 0:
        return colors.red(letter)
      case 1:
        return colors.white(letter)
      case 2:
        return colors.blue(letter)
    }
  }
})

// node_modules/@colors/colors/lib/maps/zebra.js
const require_zebra = __commonJS((_exports, module) => {
  module.exports = (colors) => (letter, i2, _exploded) =>
    i2 % 2 === 0 ? letter : colors.inverse(letter)
})

// node_modules/@colors/colors/lib/maps/rainbow.js
const require_rainbow = __commonJS((_exports, module) => {
  module.exports = (colors) => {
    const rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']
    return (letter, i2, _exploded) => {
      if (letter === ' ') {
        return letter
      }
      return colors[rainbowColors[i2++ % rainbowColors.length]](letter)
    }
  }
})

// node_modules/@colors/colors/lib/maps/random.js
const require_random = __commonJS((_exports, module) => {
  module.exports = (colors) => {
    const available = [
      'underline',
      'inverse',
      'grey',
      'yellow',
      'red',
      'green',
      'blue',
      'white',
      'cyan',
      'magenta',
      'brightYellow',
      'brightRed',
      'brightGreen',
      'brightBlue',
      'brightWhite',
      'brightCyan',
      'brightMagenta',
    ]
    return (letter, _i2, _exploded) =>
      letter === ' '
        ? letter
        : colors[available[Math.round(Math.random() * (available.length - 2))]](letter)
  }
})

// node_modules/@colors/colors/lib/colors.js
const require_colors = __commonJS((_exports, module) => {
  const colors = {}
  module.exports = colors
  colors.themes = {}
  const util = __require('util')
  const ansiStyles = (colors.styles = require_styles())
  const defineProps = Object.defineProperties
  const newLineRegex = new RegExp(/[\r\n]+/g)
  colors.supportsColor = require_supports_colors().supportsColor
  if (typeof colors.enabled === 'undefined') {
    colors.enabled = colors.supportsColor() !== false
  }
  colors.enable = () => {
    colors.enabled = true
  }
  colors.disable = () => {
    colors.enabled = false
  }
  colors.stripColors = colors.strip = (str) => `${str}`.replace(/\x1B\[\d+m/g, '')
  const _stylize = (colors.stylize = function stylize(str, style) {
    if (!colors.enabled) {
      return `${str}`
    }
    const styleMap = ansiStyles[style]
    if (!styleMap && style in colors) {
      return colors[style](str)
    }
    return styleMap.open + str + styleMap.close
  })
  const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g
  const escapeStringRegexp = (str) => {
    if (typeof str !== 'string') {
      throw new TypeError('Expected a string')
    }
    return str.replace(matchOperatorsRe, '\\$&')
  }
  function build(_styles) {
    const builder = function builder() {
      return applyStyle.apply(builder, arguments)
    }
    builder._styles = _styles
    builder.__proto__ = proto
    return builder
  }
  const styles = (() => {
    const ret = {}
    ansiStyles.grey = ansiStyles.gray
    Object.keys(ansiStyles).forEach((key) => {
      ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g')
      ret[key] = {
        get: function () {
          return build(this._styles.concat(key))
        },
      }
    })
    return ret
  })()
  const proto = defineProps(function colors() {}, styles)
  function applyStyle() {
    const args = Array.prototype.slice.call(arguments)
    let str = args
      .map((arg) => {
        if (arg != null && arg.constructor === String) {
          return arg
        }
        return util.inspect(arg)
      })
      .join(' ')
    if (!colors.enabled || !str) {
      return str
    }
    const newLinesPresent =
      str.indexOf(`
`) !== -1
    const nestedStyles = this._styles
    let i2 = nestedStyles.length
    while (i2--) {
      const code = ansiStyles[nestedStyles[i2]]
      str = code.open + str.replace(code.closeRe, code.open) + code.close
      if (newLinesPresent) {
        str = str.replace(newLineRegex, (match) => code.close + match + code.open)
      }
    }
    return str
  }
  colors.setTheme = (theme) => {
    if (typeof theme === 'string') {
      console.log(
        'colors.setTheme now only accepts an object, not a string.  ' +
          'If you are trying to set a theme from a file, it is now your (the ' +
          "caller's) responsibility to require the file.  The old syntax " +
          'looked like colors.setTheme(__dirname + ' +
          "'/../themes/generic-logging.js'); The new syntax looks like " +
          'colors.setTheme(require(__dirname + ' +
          "'/../themes/generic-logging.js'));",
      )
      return
    }
    for (const style in theme) {
      ;((style2) => {
        colors[style2] = (str) => {
          if (typeof theme[style2] === 'object') {
            let out = str
            for (const i2 in theme[style2]) {
              out = colors[theme[style2][i2]](out)
            }
            return out
          }
          return colors[theme[style2]](str)
        }
      })(style)
    }
  }
  function init() {
    const ret = {}
    Object.keys(styles).forEach((name) => {
      ret[name] = {
        get: () => build([name]),
      }
    })
    return ret
  }
  const sequencer = function sequencer(map2, str) {
    let exploded = str.split('')
    exploded = exploded.map(map2)
    return exploded.join('')
  }
  colors.trap = require_trap()
  colors.zalgo = require_zalgo()
  colors.maps = {}
  colors.maps.america = require_america()(colors)
  colors.maps.zebra = require_zebra()(colors)
  colors.maps.rainbow = require_rainbow()(colors)
  colors.maps.random = require_random()(colors)
  for (map in colors.maps) {
    ;((map2) => {
      colors[map2] = (str) => sequencer(colors.maps[map2], str)
    })(map)
  }
  let map
  defineProps(colors, init())
})

// node_modules/@colors/colors/safe.js
const require_safe = __commonJS((_exports, module) => {
  const colors = require_colors()
  module.exports = colors
})

// node_modules/cli-table3/src/cell.js
const require_cell = __commonJS((_exports, module) => {
  const { info, debug } = require_debug()
  const utils = require_utils()

  class Cell {
    constructor(options) {
      this.setOptions(options)
      this.x = null
      this.y = null
    }
    setOptions(options) {
      if (['boolean', 'number', 'bigint', 'string'].indexOf(typeof options) !== -1) {
        options = { content: `${options}` }
      }
      options = options || {}
      this.options = options
      const content = options.content
      if (['boolean', 'number', 'bigint', 'string'].indexOf(typeof content) !== -1) {
        this.content = String(content)
      } else if (content) {
        throw new Error(`Content needs to be a primitive, got: ${typeof content}`)
      } else {
        this.content = this.options.href || ''
      }
      this.colSpan = options.colSpan || 1
      this.rowSpan = options.rowSpan || 1
      if (this.options.href) {
        Object.defineProperty(this, 'href', {
          get() {
            return this.options.href
          },
        })
      }
    }
    mergeTableOptions(tableOptions, cells) {
      this.cells = cells
      const optionsChars = this.options.chars || {}
      const tableChars = tableOptions.chars
      const chars = (this.chars = {})
      CHAR_NAMES.forEach((name) => {
        setOption(optionsChars, tableChars, name, chars)
      })
      this.truncate = this.options.truncate || tableOptions.truncate
      const style = (this.options.style = this.options.style || {})
      const tableStyle = tableOptions.style
      setOption(style, tableStyle, 'padding-left', this)
      setOption(style, tableStyle, 'padding-right', this)
      this.head = style.head || tableStyle.head
      this.border = style.border || tableStyle.border
      this.fixedWidth = tableOptions.colWidths[this.x]
      this.lines = this.computeLines(tableOptions)
      this.desiredWidth = utils.strlen(this.content) + this.paddingLeft + this.paddingRight
      this.desiredHeight = this.lines.length
    }
    computeLines(tableOptions) {
      const tableWordWrap = tableOptions.wordWrap || tableOptions.textWrap
      const { wordWrap = tableWordWrap } = this.options
      if (this.fixedWidth && wordWrap) {
        this.fixedWidth -= this.paddingLeft + this.paddingRight
        if (this.colSpan) {
          let i2 = 1
          while (i2 < this.colSpan) {
            this.fixedWidth += tableOptions.colWidths[this.x + i2]
            i2++
          }
        }
        const { wrapOnWordBoundary: tableWrapOnWordBoundary = true } = tableOptions
        const { wrapOnWordBoundary = tableWrapOnWordBoundary } = this.options
        return this.wrapLines(utils.wordWrap(this.fixedWidth, this.content, wrapOnWordBoundary))
      }
      return this.wrapLines(
        this.content.split(`
`),
      )
    }
    wrapLines(computedLines) {
      const lines = utils.colorizeLines(computedLines)
      if (this.href) {
        return lines.map((line) => utils.hyperlink(this.href, line))
      }
      return lines
    }
    init(tableOptions) {
      const x2 = this.x
      const y = this.y
      this.widths = tableOptions.colWidths.slice(x2, x2 + this.colSpan)
      this.heights = tableOptions.rowHeights.slice(y, y + this.rowSpan)
      this.width = this.widths.reduce(sumPlusOne, -1)
      this.height = this.heights.reduce(sumPlusOne, -1)
      this.hAlign = this.options.hAlign || tableOptions.colAligns[x2]
      this.vAlign = this.options.vAlign || tableOptions.rowAligns[y]
      this.drawRight = x2 + this.colSpan === tableOptions.colWidths.length
    }
    draw(lineNum, spanningCell) {
      if (lineNum === 'top') {
        return this.drawTop(this.drawRight)
      }
      if (lineNum === 'bottom') {
        return this.drawBottom(this.drawRight)
      }
      const content = utils.truncate(this.content, 10, this.truncate)
      if (lineNum) {
      } else {
        info(`${this.y}-${this.x}: ${this.rowSpan - lineNum}x${this.colSpan} Cell ${content}`)
      }
      const padLen = Math.max(this.height - this.lines.length, 0)
      let padTop
      switch (this.vAlign) {
        case 'center':
          padTop = Math.ceil(padLen / 2)
          break
        case 'bottom':
          padTop = padLen
          break
        default:
          padTop = 0
      }
      if (lineNum < padTop || lineNum >= padTop + this.lines.length) {
        return this.drawEmpty(this.drawRight, spanningCell)
      }
      const forceTruncation = this.lines.length > this.height && lineNum + 1 >= this.height
      return this.drawLine(lineNum - padTop, this.drawRight, forceTruncation, spanningCell)
    }
    drawTop(drawRight) {
      const content = []
      if (this.cells) {
        this.widths.forEach(function (width, index) {
          content.push(this._topLeftChar(index))
          content.push(utils.repeat(this.chars[this.y === 0 ? 'top' : 'mid'], width))
        }, this)
      } else {
        content.push(this._topLeftChar(0))
        content.push(utils.repeat(this.chars[this.y === 0 ? 'top' : 'mid'], this.width))
      }
      if (drawRight) {
        content.push(this.chars[this.y === 0 ? 'topRight' : 'rightMid'])
      }
      return this.wrapWithStyleColors('border', content.join(''))
    }
    _topLeftChar(offset) {
      const x2 = this.x + offset
      let leftChar
      if (this.y === 0) {
        leftChar = x2 === 0 ? 'topLeft' : offset === 0 ? 'topMid' : 'top'
      } else if (x2 === 0) {
        leftChar = 'leftMid'
      } else {
        leftChar = offset === 0 ? 'midMid' : 'bottomMid'
        if (this.cells) {
          const spanAbove = this.cells[this.y - 1][x2] instanceof Cell.ColSpanCell
          if (spanAbove) {
            leftChar = offset === 0 ? 'topMid' : 'mid'
          }
          if (offset === 0) {
            let i2 = 1
            while (this.cells[this.y][x2 - i2] instanceof Cell.ColSpanCell) {
              i2++
            }
            if (this.cells[this.y][x2 - i2] instanceof Cell.RowSpanCell) {
              leftChar = 'leftMid'
            }
          }
        }
      }
      return this.chars[leftChar]
    }
    wrapWithStyleColors(styleProperty, content) {
      if (this[styleProperty]?.length) {
        try {
          let colors = require_safe()
          for (let i2 = this[styleProperty].length - 1; i2 >= 0; i2--) {
            colors = colors[this[styleProperty][i2]]
          }
          return colors(content)
        } catch (_e2) {
          return content
        }
      } else {
        return content
      }
    }
    drawLine(lineNum, drawRight, forceTruncationSymbol, spanningCell) {
      let left = this.chars[this.x === 0 ? 'left' : 'middle']
      if (this.x && spanningCell && this.cells) {
        let cellLeft = this.cells[this.y + spanningCell][this.x - 1]
        while (cellLeft instanceof ColSpanCell) {
          cellLeft = this.cells[cellLeft.y][cellLeft.x - 1]
        }
        if (!(cellLeft instanceof RowSpanCell)) {
          left = this.chars.rightMid
        }
      }
      const leftPadding = utils.repeat(' ', this.paddingLeft)
      const right = drawRight ? this.chars.right : ''
      const rightPadding = utils.repeat(' ', this.paddingRight)
      let line = this.lines[lineNum]
      const len = this.width - (this.paddingLeft + this.paddingRight)
      if (forceTruncationSymbol) {
        line += this.truncate || '…'
      }
      let content = utils.truncate(line, len, this.truncate)
      content = utils.pad(content, len, ' ', this.hAlign)
      content = leftPadding + content + rightPadding
      return this.stylizeLine(left, content, right)
    }
    stylizeLine(left, content, right) {
      left = this.wrapWithStyleColors('border', left)
      right = this.wrapWithStyleColors('border', right)
      if (this.y === 0) {
        content = this.wrapWithStyleColors('head', content)
      }
      return left + content + right
    }
    drawBottom(drawRight) {
      const left = this.chars[this.x === 0 ? 'bottomLeft' : 'bottomMid']
      const content = utils.repeat(this.chars.bottom, this.width)
      const right = drawRight ? this.chars.bottomRight : ''
      return this.wrapWithStyleColors('border', left + content + right)
    }
    drawEmpty(drawRight, spanningCell) {
      let left = this.chars[this.x === 0 ? 'left' : 'middle']
      if (this.x && spanningCell && this.cells) {
        let cellLeft = this.cells[this.y + spanningCell][this.x - 1]
        while (cellLeft instanceof ColSpanCell) {
          cellLeft = this.cells[cellLeft.y][cellLeft.x - 1]
        }
        if (!(cellLeft instanceof RowSpanCell)) {
          left = this.chars.rightMid
        }
      }
      const right = drawRight ? this.chars.right : ''
      const content = utils.repeat(' ', this.width)
      return this.stylizeLine(left, content, right)
    }
  }

  class ColSpanCell {
    draw(lineNum) {
      if (typeof lineNum === 'number') {
        debug(`${this.y}-${this.x}: 1x1 ColSpanCell`)
      }
      return ''
    }
    init() {}
    mergeTableOptions() {}
  }

  class RowSpanCell {
    constructor(originalCell) {
      this.originalCell = originalCell
    }
    init(tableOptions) {
      const y = this.y
      const originalY = this.originalCell.y
      this.cellOffset = y - originalY
      this.offset = findDimension(tableOptions.rowHeights, originalY, this.cellOffset)
    }
    draw(lineNum) {
      if (lineNum === 'top') {
        return this.originalCell.draw(this.offset, this.cellOffset)
      }
      if (lineNum === 'bottom') {
        return this.originalCell.draw('bottom')
      }
      debug(`${this.y}-${this.x}: 1x${this.colSpan} RowSpanCell for ${this.originalCell.content}`)
      return this.originalCell.draw(this.offset + 1 + lineNum)
    }
    mergeTableOptions() {}
  }
  function firstDefined(...args) {
    return args.filter((v) => v !== undefined && v !== null).shift()
  }
  function setOption(objA, objB, nameB, targetObj) {
    let nameA = nameB.split('-')
    if (nameA.length > 1) {
      nameA[1] = nameA[1].charAt(0).toUpperCase() + nameA[1].substr(1)
      nameA = nameA.join('')
      targetObj[nameA] = firstDefined(objA[nameA], objA[nameB], objB[nameA], objB[nameB])
    } else {
      targetObj[nameB] = firstDefined(objA[nameB], objB[nameB])
    }
  }
  function findDimension(dimensionTable, startingIndex, span) {
    let ret = dimensionTable[startingIndex]
    for (let i2 = 1; i2 < span; i2++) {
      ret += 1 + dimensionTable[startingIndex + i2]
    }
    return ret
  }
  function sumPlusOne(a, b) {
    return a + b + 1
  }
  const CHAR_NAMES = [
    'top',
    'top-mid',
    'top-left',
    'top-right',
    'bottom',
    'bottom-mid',
    'bottom-left',
    'bottom-right',
    'left',
    'left-mid',
    'mid',
    'mid-mid',
    'right',
    'right-mid',
    'middle',
  ]
  module.exports = Cell
  module.exports.ColSpanCell = ColSpanCell
  module.exports.RowSpanCell = RowSpanCell
})

// node_modules/cli-table3/src/layout-manager.js
const require_layout_manager = __commonJS((_exports, module) => {
  const { warn, debug } = require_debug()
  const Cell = require_cell()
  const { ColSpanCell, RowSpanCell } = Cell
  ;(() => {
    function next(alloc, col) {
      if (alloc[col] > 0) {
        return next(alloc, col + 1)
      }
      return col
    }
    function layoutTable(table) {
      const alloc = {}
      table.forEach((row, rowIndex) => {
        let col = 0
        row.forEach((cell) => {
          cell.y = rowIndex
          cell.x = rowIndex ? next(alloc, col) : col
          const rowSpan = cell.rowSpan || 1
          const colSpan = cell.colSpan || 1
          if (rowSpan > 1) {
            for (let cs = 0; cs < colSpan; cs++) {
              alloc[cell.x + cs] = rowSpan
            }
          }
          col = cell.x + colSpan
        })
        Object.keys(alloc).forEach((idx) => {
          alloc[idx]--
          if (alloc[idx] < 1) {
            delete alloc[idx]
          }
        })
      })
    }
    function maxWidth(table) {
      let mw = 0
      table.forEach((row) => {
        row.forEach((cell) => {
          mw = Math.max(mw, cell.x + (cell.colSpan || 1))
        })
      })
      return mw
    }
    function maxHeight(table) {
      return table.length
    }
    function cellsConflict(cell1, cell2) {
      const yMin1 = cell1.y
      const yMax1 = cell1.y - 1 + (cell1.rowSpan || 1)
      const yMin2 = cell2.y
      const yMax2 = cell2.y - 1 + (cell2.rowSpan || 1)
      const yConflict = !(yMin1 > yMax2 || yMin2 > yMax1)
      const xMin1 = cell1.x
      const xMax1 = cell1.x - 1 + (cell1.colSpan || 1)
      const xMin2 = cell2.x
      const xMax2 = cell2.x - 1 + (cell2.colSpan || 1)
      const xConflict = !(xMin1 > xMax2 || xMin2 > xMax1)
      return yConflict && xConflict
    }
    function conflictExists(rows, x2, y) {
      const i_max = Math.min(rows.length - 1, y)
      const cell = { x: x2, y }
      for (let i2 = 0; i2 <= i_max; i2++) {
        const row = rows[i2]
        for (let j = 0; j < row.length; j++) {
          if (cellsConflict(cell, row[j])) {
            return true
          }
        }
      }
      return false
    }
    function allBlank(rows, y, xMin, xMax) {
      for (let x2 = xMin; x2 < xMax; x2++) {
        if (conflictExists(rows, x2, y)) {
          return false
        }
      }
      return true
    }
    function addRowSpanCells(table) {
      table.forEach((row, rowIndex) => {
        row.forEach((cell) => {
          for (let i2 = 1; i2 < cell.rowSpan; i2++) {
            const rowSpanCell = new RowSpanCell(cell)
            rowSpanCell.x = cell.x
            rowSpanCell.y = cell.y + i2
            rowSpanCell.colSpan = cell.colSpan
            insertCell(rowSpanCell, table[rowIndex + i2])
          }
        })
      })
    }
    function addColSpanCells(cellRows) {
      for (let rowIndex = cellRows.length - 1; rowIndex >= 0; rowIndex--) {
        const cellColumns = cellRows[rowIndex]
        for (let columnIndex = 0; columnIndex < cellColumns.length; columnIndex++) {
          const cell = cellColumns[columnIndex]
          for (let k = 1; k < cell.colSpan; k++) {
            const colSpanCell = new ColSpanCell()
            colSpanCell.x = cell.x + k
            colSpanCell.y = cell.y
            cellColumns.splice(columnIndex + 1, 0, colSpanCell)
          }
        }
      }
    }
    function insertCell(cell, row) {
      let x2 = 0
      while (x2 < row.length && row[x2].x < cell.x) {
        x2++
      }
      row.splice(x2, 0, cell)
    }
    function fillInTable(table) {
      const h_max = maxHeight(table)
      const w_max = maxWidth(table)
      debug(`Max rows: ${h_max}; Max cols: ${w_max}`)
      for (let y = 0; y < h_max; y++) {
        for (let x2 = 0; x2 < w_max; x2++) {
          if (!conflictExists(table, x2, y)) {
            const opts = { x: x2, y, colSpan: 1, rowSpan: 1 }
            x2++
            while (x2 < w_max && !conflictExists(table, x2, y)) {
              opts.colSpan++
              x2++
            }
            let y2 = y + 1
            while (y2 < h_max && allBlank(table, y2, opts.x, opts.x + opts.colSpan)) {
              opts.rowSpan++
              y2++
            }
            const cell = new Cell(opts)
            cell.x = opts.x
            cell.y = opts.y
            warn(`Missing cell at ${cell.y}-${cell.x}.`)
            insertCell(cell, table[y])
          }
        }
      }
    }
    function generateCells(rows) {
      return rows.map((row) => {
        if (!Array.isArray(row)) {
          const key = Object.keys(row)[0]
          row = row[key]
          if (Array.isArray(row)) {
            row = row.slice()
            row.unshift(key)
          } else {
            row = [key, row]
          }
        }
        return row.map((cell) => new Cell(cell))
      })
    }
    function makeTableLayout(rows) {
      const cellRows = generateCells(rows)
      layoutTable(cellRows)
      fillInTable(cellRows)
      addRowSpanCells(cellRows)
      addColSpanCells(cellRows)
      return cellRows
    }
    module.exports = {
      makeTableLayout,
      layoutTable,
      addRowSpanCells,
      maxWidth,
      fillInTable,
      computeWidths: makeComputeWidths('colSpan', 'desiredWidth', 'x', 1),
      computeHeights: makeComputeWidths('rowSpan', 'desiredHeight', 'y', 1),
    }
  })()
  function makeComputeWidths(colSpan, desiredWidth, x2, forcedMin) {
    return (vals, table) => {
      const result = []
      const spanners = []
      const auto = {}
      table.forEach((row) => {
        row.forEach((cell) => {
          if ((cell[colSpan] || 1) > 1) {
            spanners.push(cell)
          } else {
            result[cell[x2]] = Math.max(result[cell[x2]] || 0, cell[desiredWidth] || 0, forcedMin)
          }
        })
      })
      vals.forEach((val, index) => {
        if (typeof val === 'number') {
          result[index] = val
        }
      })
      for (let k = spanners.length - 1; k >= 0; k--) {
        const cell = spanners[k]
        const span = cell[colSpan]
        const col = cell[x2]
        let existingWidth = result[col]
        let editableCols = typeof vals[col] === 'number' ? 0 : 1
        if (typeof existingWidth === 'number') {
          for (let i2 = 1; i2 < span; i2++) {
            existingWidth += 1 + result[col + i2]
            if (typeof vals[col + i2] !== 'number') {
              editableCols++
            }
          }
        } else {
          existingWidth = desiredWidth === 'desiredWidth' ? cell.desiredWidth - 1 : 1
          if (!auto[col] || auto[col] < existingWidth) {
            auto[col] = existingWidth
          }
        }
        if (cell[desiredWidth] > existingWidth) {
          let i2 = 0
          while (editableCols > 0 && cell[desiredWidth] > existingWidth) {
            if (typeof vals[col + i2] !== 'number') {
              const dif = Math.round((cell[desiredWidth] - existingWidth) / editableCols)
              existingWidth += dif
              result[col + i2] += dif
              editableCols--
            }
            i2++
          }
        }
      }
      Object.assign(vals, result, auto)
      for (let j = 0; j < vals.length; j++) {
        vals[j] = Math.max(forcedMin, vals[j] || 0)
      }
    }
  }
})

// node_modules/cli-table3/src/table.js
const require_table = __commonJS((_exports, module) => {
  const debug = require_debug()
  const utils = require_utils()
  const tableLayout = require_layout_manager()

  class Table extends Array {
    constructor(opts) {
      super()
      const options = utils.mergeOptions(opts)
      Object.defineProperty(this, 'options', {
        value: options,
        enumerable: options.debug,
      })
      if (options.debug) {
        switch (typeof options.debug) {
          case 'boolean':
            debug.setDebugLevel(debug.WARN)
            break
          case 'number':
            debug.setDebugLevel(options.debug)
            break
          case 'string':
            debug.setDebugLevel(Number.parseInt(options.debug, 10))
            break
          default:
            debug.setDebugLevel(debug.WARN)
            debug.warn(
              `Debug option is expected to be boolean, number, or string. Received a ${typeof options.debug}`,
            )
        }
        Object.defineProperty(this, 'messages', {
          get() {
            return debug.debugMessages()
          },
        })
      }
    }
    toString() {
      let array = this
      const headersPresent = this.options.head?.length
      if (headersPresent) {
        array = [this.options.head]
        if (this.length) {
          array.push.apply(array, this)
        }
      } else {
        this.options.style.head = []
      }
      const cells = tableLayout.makeTableLayout(array)
      cells.forEach(function (row) {
        row.forEach(function (cell) {
          cell.mergeTableOptions(this.options, cells)
        }, this)
      }, this)
      tableLayout.computeWidths(this.options.colWidths, cells)
      tableLayout.computeHeights(this.options.rowHeights, cells)
      cells.forEach(function (row) {
        row.forEach(function (cell) {
          cell.init(this.options)
        }, this)
      }, this)
      const result = []
      for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
        const row = cells[rowIndex]
        const heightOfRow = this.options.rowHeights[rowIndex]
        if (rowIndex === 0 || !this.options.style.compact || (rowIndex === 1 && headersPresent)) {
          doDraw(row, 'top', result)
        }
        for (let lineNum = 0; lineNum < heightOfRow; lineNum++) {
          doDraw(row, lineNum, result)
        }
        if (rowIndex + 1 === cells.length) {
          doDraw(row, 'bottom', result)
        }
      }
      return result.join(`
`)
    }
    get width() {
      const str = this.toString().split(`
`)
      return str[0].length
    }
  }
  Table.reset = () => debug.reset()
  function doDraw(row, lineNum, result) {
    const line = []
    row.forEach((cell) => {
      line.push(cell.draw(lineNum))
    })
    const str = line.join('')
    if (str.length) {
      result.push(str)
    }
  }
  module.exports = Table
})

// node_modules/dotenv/package.json
const require_package = __commonJS((_exports, module) => {
  module.exports = {
    name: 'dotenv',
    version: '16.6.1',
    description: 'Loads environment variables from .env file',
    main: 'lib/main.js',
    types: 'lib/main.d.ts',
    exports: {
      '.': {
        types: './lib/main.d.ts',
        require: './lib/main.js',
        default: './lib/main.js',
      },
      './config': './config.js',
      './config.js': './config.js',
      './lib/env-options': './lib/env-options.js',
      './lib/env-options.js': './lib/env-options.js',
      './lib/cli-options': './lib/cli-options.js',
      './lib/cli-options.js': './lib/cli-options.js',
      './package.json': './package.json',
    },
    scripts: {
      'dts-check': 'tsc --project tests/types/tsconfig.json',
      lint: 'standard',
      pretest: 'npm run lint && npm run dts-check',
      test: 'tap run --allow-empty-coverage --disable-coverage --timeout=60000',
      'test:coverage':
        'tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov',
      prerelease: 'npm test',
      release: 'standard-version',
    },
    repository: {
      type: 'git',
      url: 'git://github.com/motdotla/dotenv.git',
    },
    homepage: 'https://github.com/motdotla/dotenv#readme',
    funding: 'https://dotenvx.com',
    keywords: ['dotenv', 'env', '.env', 'environment', 'variables', 'config', 'settings'],
    readmeFilename: 'README.md',
    license: 'BSD-2-Clause',
    devDependencies: {
      '@types/node': '^18.11.3',
      decache: '^4.6.2',
      sinon: '^14.0.1',
      standard: '^17.0.0',
      'standard-version': '^9.5.0',
      tap: '^19.2.0',
      typescript: '^4.8.4',
    },
    engines: {
      node: '>=12',
    },
    browser: {
      fs: false,
    },
  }
})

// node_modules/dotenv/lib/main.js
const require_main = __commonJS((exports, module) => {
  const fs2 = __require('fs')
  const path = __require('path')
  const os2 = __require('os')
  const crypto = __require('crypto')
  const packageJson = require_package()
  const version = packageJson.version
  const LINE =
    /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm
  function parse(src) {
    const obj = {}
    let lines = src.toString()
    lines = lines.replace(
      /\r\n?/gm,
      `
`,
    )
    let match
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1]
      let value = match[2] || ''
      value = value.trim()
      const maybeQuote = value[0]
      value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2')
      if (maybeQuote === '"') {
        value = value.replace(
          /\\n/g,
          `
`,
        )
        value = value.replace(/\\r/g, '\r')
      }
      obj[key] = value
    }
    return obj
  }
  function _parseVault(options) {
    options = options || {}
    const vaultPath = _vaultPath(options)
    options.path = vaultPath
    const result = DotenvModule.configDotenv(options)
    if (!result.parsed) {
      const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
      err.code = 'MISSING_DATA'
      throw err
    }
    const keys = _dotenvKey(options).split(',')
    const length = keys.length
    let decrypted
    for (let i2 = 0; i2 < length; i2++) {
      try {
        const key = keys[i2].trim()
        const attrs = _instructions(result, key)
        decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key)
        break
      } catch (error) {
        if (i2 + 1 >= length) {
          throw error
        }
      }
    }
    return DotenvModule.parse(decrypted)
  }
  function _warn(message) {
    console.log(`[dotenv@${version}][WARN] ${message}`)
  }
  function _debug(message) {
    console.log(`[dotenv@${version}][DEBUG] ${message}`)
  }
  function _log(message) {
    console.log(`[dotenv@${version}] ${message}`)
  }
  function _dotenvKey(options) {
    if (options?.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
      return options.DOTENV_KEY
    }
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
      return process.env.DOTENV_KEY
    }
    return ''
  }
  function _instructions(result, dotenvKey) {
    let uri
    try {
      uri = new URL(dotenvKey)
    } catch (error) {
      if (error.code === 'ERR_INVALID_URL') {
        const err = new Error(
          'INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development',
        )
        err.code = 'INVALID_DOTENV_KEY'
        throw err
      }
      throw error
    }
    const key = uri.password
    if (!key) {
      const err = new Error('INVALID_DOTENV_KEY: Missing key part')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }
    const environment = uri.searchParams.get('environment')
    if (!environment) {
      const err = new Error('INVALID_DOTENV_KEY: Missing environment part')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
    const ciphertext = result.parsed[environmentKey]
    if (!ciphertext) {
      const err = new Error(
        `NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`,
      )
      err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'
      throw err
    }
    return { ciphertext, key }
  }
  function _vaultPath(options) {
    let possibleVaultPath = null
    if (options?.path && options.path.length > 0) {
      if (Array.isArray(options.path)) {
        for (const filepath of options.path) {
          if (fs2.existsSync(filepath)) {
            possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`
          }
        }
      } else {
        possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`
      }
    } else {
      possibleVaultPath = path.resolve(process.cwd(), '.env.vault')
    }
    if (fs2.existsSync(possibleVaultPath)) {
      return possibleVaultPath
    }
    return null
  }
  function _resolveHome(envPath) {
    return envPath[0] === '~' ? path.join(os2.homedir(), envPath.slice(1)) : envPath
  }
  function _configVault(options) {
    const debug = Boolean(options?.debug)
    const quiet = options && 'quiet' in options ? options.quiet : true
    if (debug || !quiet) {
      _log('Loading env from encrypted .env.vault')
    }
    const parsed = DotenvModule._parseVault(options)
    let processEnv = process.env
    if (options && options.processEnv != null) {
      processEnv = options.processEnv
    }
    DotenvModule.populate(processEnv, parsed, options)
    return { parsed }
  }
  function configDotenv(options) {
    const dotenvPath = path.resolve(process.cwd(), '.env')
    let encoding = 'utf8'
    const debug = Boolean(options?.debug)
    const quiet = options && 'quiet' in options ? options.quiet : true
    if (options?.encoding) {
      encoding = options.encoding
    } else if (debug) {
      _debug('No encoding is specified. UTF-8 is used by default')
    }
    let optionPaths = [dotenvPath]
    if (options?.path) {
      if (Array.isArray(options.path)) {
        optionPaths = []
        for (const filepath of options.path) {
          optionPaths.push(_resolveHome(filepath))
        }
      } else {
        optionPaths = [_resolveHome(options.path)]
      }
    }
    let lastError
    const parsedAll = {}
    for (const path2 of optionPaths) {
      try {
        const parsed = DotenvModule.parse(fs2.readFileSync(path2, { encoding }))
        DotenvModule.populate(parsedAll, parsed, options)
      } catch (e2) {
        if (debug) {
          _debug(`Failed to load ${path2} ${e2.message}`)
        }
        lastError = e2
      }
    }
    let processEnv = process.env
    if (options && options.processEnv != null) {
      processEnv = options.processEnv
    }
    DotenvModule.populate(processEnv, parsedAll, options)
    if (debug || !quiet) {
      const keysCount = Object.keys(parsedAll).length
      const shortPaths = []
      for (const filePath of optionPaths) {
        try {
          const relative = path.relative(process.cwd(), filePath)
          shortPaths.push(relative)
        } catch (e2) {
          if (debug) {
            _debug(`Failed to load ${filePath} ${e2.message}`)
          }
          lastError = e2
        }
      }
      _log(`injecting env (${keysCount}) from ${shortPaths.join(',')}`)
    }
    if (lastError) {
      return { parsed: parsedAll, error: lastError }
    }
    return { parsed: parsedAll }
  }
  function config(options) {
    if (_dotenvKey(options).length === 0) {
      return DotenvModule.configDotenv(options)
    }
    const vaultPath = _vaultPath(options)
    if (!vaultPath) {
      _warn(
        `You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`,
      )
      return DotenvModule.configDotenv(options)
    }
    return DotenvModule._configVault(options)
  }
  function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), 'hex')
    let ciphertext = Buffer.from(encrypted, 'base64')
    const nonce = ciphertext.subarray(0, 12)
    const authTag = ciphertext.subarray(-16)
    ciphertext = ciphertext.subarray(12, -16)
    try {
      const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
      aesgcm.setAuthTag(authTag)
      return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
    } catch (error) {
      const isRange = error instanceof RangeError
      const invalidKeyLength = error.message === 'Invalid key length'
      const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'
      if (isRange || invalidKeyLength) {
        const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
        err.code = 'INVALID_DOTENV_KEY'
        throw err
      }
      if (decryptionFailed) {
        const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY')
        err.code = 'DECRYPTION_FAILED'
        throw err
      }
      throw error
    }
  }
  function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options?.debug)
    const override = Boolean(options?.override)
    if (typeof parsed !== 'object') {
      const err = new Error(
        'OBJECT_REQUIRED: Please check the processEnv argument being passed to populate',
      )
      err.code = 'OBJECT_REQUIRED'
      throw err
    }
    for (const key of Object.keys(parsed)) {
      if (Object.hasOwn(processEnv, key)) {
        if (override === true) {
          processEnv[key] = parsed[key]
        }
        if (debug) {
          if (override === true) {
            _debug(`"${key}" is already defined and WAS overwritten`)
          } else {
            _debug(`"${key}" is already defined and was NOT overwritten`)
          }
        }
      } else {
        processEnv[key] = parsed[key]
      }
    }
  }
  const DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate,
  }
  exports.configDotenv = DotenvModule.configDotenv
  exports._configVault = DotenvModule._configVault
  exports._parseVault = DotenvModule._parseVault
  exports.config = DotenvModule.config
  exports.decrypt = DotenvModule.decrypt
  exports.parse = DotenvModule.parse
  exports.populate = DotenvModule.populate
  module.exports = DotenvModule
})

// node_modules/commander/esm.mjs
const import__ = __toESM(require_commander(), 1)
const {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help,
} = import__.default

import { Buffer as Buffer3 } from 'node:buffer'
// node_modules/node-fetch/src/index.js
import http2 from 'node:http'
import https from 'node:https'
import Stream2, { PassThrough as PassThrough2, pipeline as pump } from 'node:stream'
import zlib from 'node:zlib'

// node_modules/data-uri-to-buffer/dist/index.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")')
  }
  uri = uri.replace(/\r?\n/g, '')
  const firstComma = uri.indexOf(',')
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError('malformed data: URI')
  }
  const meta = uri.substring(5, firstComma).split(';')
  let charset = ''
  let base64 = false
  const type = meta[0] || 'text/plain'
  let typeFull = type
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === 'base64') {
      base64 = true
    } else if (meta[i]) {
      typeFull += `;${meta[i]}`
      if (meta[i].indexOf('charset=') === 0) {
        charset = meta[i].substring(8)
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ';charset=US-ASCII'
    charset = 'US-ASCII'
  }
  const encoding = base64 ? 'base64' : 'ascii'
  const data = unescape(uri.substring(firstComma + 1))
  const buffer = Buffer.from(data, encoding)
  buffer.type = type
  buffer.typeFull = typeFull
  buffer.charset = charset
  return buffer
}
const dist_default = dataUriToBuffer

// node_modules/node-fetch/src/body.js
init_fetch_blob()
init_esm_min()

import { Buffer as Buffer2 } from 'node:buffer'
import Stream, { PassThrough } from 'node:stream'
import { deprecate, promisify, types } from 'node:util'

// node_modules/node-fetch/src/errors/base.js
class FetchBaseError extends Error {
  constructor(message, type) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.type = type
  }
  get name() {
    return this.constructor.name
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name
  }
}

// node_modules/node-fetch/src/errors/fetch-error.js
class FetchError extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type)
    if (systemError) {
      this.code = this.errno = systemError.code
      this.erroredSysCall = systemError.syscall
    }
  }
}

// node_modules/node-fetch/src/utils/is.js
const NAME = Symbol.toStringTag
const isURLSearchParameters = (object) => {
  return (
    typeof object === 'object' &&
    typeof object.append === 'function' &&
    typeof object.delete === 'function' &&
    typeof object.get === 'function' &&
    typeof object.getAll === 'function' &&
    typeof object.has === 'function' &&
    typeof object.set === 'function' &&
    typeof object.sort === 'function' &&
    object[NAME] === 'URLSearchParams'
  )
}
const isBlob = (object) => {
  return (
    object &&
    typeof object === 'object' &&
    typeof object.arrayBuffer === 'function' &&
    typeof object.type === 'string' &&
    typeof object.stream === 'function' &&
    typeof object.constructor === 'function' &&
    /^(Blob|File)$/.test(object[NAME])
  )
}
const isAbortSignal = (object) => {
  return (
    typeof object === 'object' && (object[NAME] === 'AbortSignal' || object[NAME] === 'EventTarget')
  )
}
const isDomainOrSubdomain = (destination, original) => {
  const orig = new URL(original).hostname
  const dest = new URL(destination).hostname
  return orig === dest || orig.endsWith(`.${dest}`)
}
const isSameProtocol = (destination, original) => {
  const orig = new URL(original).protocol
  const dest = new URL(destination).protocol
  return orig === dest
}

// node_modules/node-fetch/src/body.js
const pipeline = promisify(Stream.pipeline)
const INTERNALS = Symbol('Body internals')

class Body {
  constructor(body, { size = 0 } = {}) {
    let boundary = null
    if (body === null) {
      body = null
    } else if (isURLSearchParameters(body)) {
      body = Buffer2.from(body.toString())
    } else if (isBlob(body)) {
    } else if (Buffer2.isBuffer(body)) {
    } else if (types.isAnyArrayBuffer(body)) {
      body = Buffer2.from(body)
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer2.from(body.buffer, body.byteOffset, body.byteLength)
    } else if (body instanceof Stream) {
    } else if (body instanceof FormData) {
      body = formDataToBlob(body)
      boundary = body.type.split('=')[1]
    } else {
      body = Buffer2.from(String(body))
    }
    let stream = body
    if (Buffer2.isBuffer(body)) {
      stream = Stream.Readable.from(body)
    } else if (isBlob(body)) {
      stream = Stream.Readable.from(body.stream())
    }
    this[INTERNALS] = {
      body,
      stream,
      boundary,
      disturbed: false,
      error: null,
    }
    this.size = size
    if (body instanceof Stream) {
      body.on('error', (error_) => {
        const error =
          error_ instanceof FetchBaseError
            ? error_
            : new FetchError(
                `Invalid response body while trying to fetch ${this.url}: ${error_.message}`,
                'system',
                error_,
              )
        this[INTERNALS].error = error
      })
    }
  }
  get body() {
    return this[INTERNALS].stream
  }
  get bodyUsed() {
    return this[INTERNALS].disturbed
  }
  async arrayBuffer() {
    const { buffer, byteOffset, byteLength } = await consumeBody(this)
    return buffer.slice(byteOffset, byteOffset + byteLength)
  }
  async formData() {
    const ct = this.headers.get('content-type')
    if (ct.startsWith('application/x-www-form-urlencoded')) {
      const formData = new FormData()
      const parameters = new URLSearchParams(await this.text())
      for (const [name, value] of parameters) {
        formData.append(name, value)
      }
      return formData
    }
    const { toFormData: toFormData2 } = await Promise.resolve().then(
      () => (init_multipart_parser(), exports_multipart_parser),
    )
    return toFormData2(this.body, ct)
  }
  async blob() {
    const ct = this.headers?.get('content-type') || this[INTERNALS].body?.type || ''
    const buf = await this.arrayBuffer()
    return new fetch_blob_default([buf], {
      type: ct,
    })
  }
  async json() {
    const text = await this.text()
    return JSON.parse(text)
  }
  async text() {
    const buffer = await consumeBody(this)
    return new TextDecoder().decode(buffer)
  }
  buffer() {
    return consumeBody(this)
  }
}
Body.prototype.buffer = deprecate(
  Body.prototype.buffer,
  "Please use 'response.arrayBuffer()' instead of 'response.buffer()'",
  'node-fetch#buffer',
)
Object.defineProperties(Body.prototype, {
  body: { enumerable: true },
  bodyUsed: { enumerable: true },
  arrayBuffer: { enumerable: true },
  blob: { enumerable: true },
  json: { enumerable: true },
  text: { enumerable: true },
  data: {
    get: deprecate(
      () => {},
      "data doesn't exist, use json(), text(), arrayBuffer(), or body instead",
      'https://github.com/node-fetch/node-fetch/issues/1000 (response)',
    ),
  },
})
async function consumeBody(data) {
  if (data[INTERNALS].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`)
  }
  data[INTERNALS].disturbed = true
  if (data[INTERNALS].error) {
    throw data[INTERNALS].error
  }
  const { body } = data
  if (body === null) {
    return Buffer2.alloc(0)
  }
  if (!(body instanceof Stream)) {
    return Buffer2.alloc(0)
  }
  const accum = []
  let accumBytes = 0
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error = new FetchError(
          `content size at ${data.url} over limit: ${data.size}`,
          'max-size',
        )
        body.destroy(error)
        throw error
      }
      accumBytes += chunk.length
      accum.push(chunk)
    }
  } catch (error) {
    const error_ =
      error instanceof FetchBaseError
        ? error
        : new FetchError(
            `Invalid response body while trying to fetch ${data.url}: ${error.message}`,
            'system',
            error,
          )
    throw error_
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === 'string')) {
        return Buffer2.from(accum.join(''))
      }
      return Buffer2.concat(accum, accumBytes)
    } catch (error) {
      throw new FetchError(
        `Could not create Buffer from response body for ${data.url}: ${error.message}`,
        'system',
        error,
      )
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`)
  }
}
const clone = (instance, highWaterMark) => {
  let p1
  let p2
  let { body } = instance[INTERNALS]
  if (instance.bodyUsed) {
    throw new Error('cannot clone body after it is used')
  }
  if (body instanceof Stream && typeof body.getBoundary !== 'function') {
    p1 = new PassThrough({ highWaterMark })
    p2 = new PassThrough({ highWaterMark })
    body.pipe(p1)
    body.pipe(p2)
    instance[INTERNALS].stream = p1
    body = p2
  }
  return body
}
const getNonSpecFormDataBoundary = deprecate(
  (body) => body.getBoundary(),
  "form-data doesn't follow the spec and requires special treatment. Use alternative package",
  'https://github.com/node-fetch/node-fetch/issues/1167',
)
const extractContentType = (body, request) => {
  if (body === null) {
    return null
  }
  if (typeof body === 'string') {
    return 'text/plain;charset=UTF-8'
  }
  if (isURLSearchParameters(body)) {
    return 'application/x-www-form-urlencoded;charset=UTF-8'
  }
  if (isBlob(body)) {
    return body.type || null
  }
  if (Buffer2.isBuffer(body) || types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null
  }
  if (body instanceof FormData) {
    return `multipart/form-data; boundary=${request[INTERNALS].boundary}`
  }
  if (body && typeof body.getBoundary === 'function') {
    return `multipart/form-data;boundary=${getNonSpecFormDataBoundary(body)}`
  }
  if (body instanceof Stream) {
    return null
  }
  return 'text/plain;charset=UTF-8'
}
const getTotalBytes = (request) => {
  const { body } = request[INTERNALS]
  if (body === null) {
    return 0
  }
  if (isBlob(body)) {
    return body.size
  }
  if (Buffer2.isBuffer(body)) {
    return body.length
  }
  if (body && typeof body.getLengthSync === 'function') {
    return body.hasKnownLength?.() ? body.getLengthSync() : null
  }
  return null
}
const writeToStream = async (dest, { body }) => {
  if (body === null) {
    dest.end()
  } else {
    await pipeline(body, dest)
  }
}

import http from 'node:http'
// node_modules/node-fetch/src/headers.js
import { types as types2 } from 'node:util'

const validateHeaderName =
  typeof http.validateHeaderName === 'function'
    ? http.validateHeaderName
    : (name) => {
        if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
          const error = new TypeError(`Header name must be a valid HTTP token [${name}]`)
          Object.defineProperty(error, 'code', { value: 'ERR_INVALID_HTTP_TOKEN' })
          throw error
        }
      }
const validateHeaderValue =
  typeof http.validateHeaderValue === 'function'
    ? http.validateHeaderValue
    : (name, value) => {
        if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
          const error = new TypeError(`Invalid character in header content ["${name}"]`)
          Object.defineProperty(error, 'code', { value: 'ERR_INVALID_CHAR' })
          throw error
        }
      }

class Headers extends URLSearchParams {
  constructor(init) {
    let result = []
    if (init instanceof Headers) {
      const raw = init.raw()
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]))
      }
    } else if (init == null) {
    } else if (typeof init === 'object' && !types2.isBoxedPrimitive(init)) {
      const method = init[Symbol.iterator]
      if (method == null) {
        result.push(...Object.entries(init))
      } else {
        if (typeof method !== 'function') {
          throw new TypeError('Header pairs must be iterable')
        }
        result = [...init]
          .map((pair) => {
            if (typeof pair !== 'object' || types2.isBoxedPrimitive(pair)) {
              throw new TypeError('Each header pair must be an iterable object')
            }
            return [...pair]
          })
          .map((pair) => {
            if (pair.length !== 2) {
              throw new TypeError('Each header pair must be a name/value tuple')
            }
            return [...pair]
          })
      }
    } else {
      throw new TypeError(
        "Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)",
      )
    }
    result =
      result.length > 0
        ? result.map(([name, value]) => {
            validateHeaderName(name)
            validateHeaderValue(name, String(value))
            return [String(name).toLowerCase(), String(value)]
          })
        : undefined
    super(result)
    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case 'append':
          case 'set':
            return (name, value) => {
              validateHeaderName(name)
              validateHeaderValue(name, String(value))
              return URLSearchParams.prototype[p].call(
                target,
                String(name).toLowerCase(),
                String(value),
              )
            }
          case 'delete':
          case 'has':
          case 'getAll':
            return (name) => {
              validateHeaderName(name)
              return URLSearchParams.prototype[p].call(target, String(name).toLowerCase())
            }
          case 'keys':
            return () => {
              target.sort()
              return new Set(URLSearchParams.prototype.keys.call(target)).keys()
            }
          default:
            return Reflect.get(target, p, receiver)
        }
      },
    })
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name
  }
  toString() {
    return Object.prototype.toString.call(this)
  }
  get(name) {
    const values = this.getAll(name)
    if (values.length === 0) {
      return null
    }
    let value = values.join(', ')
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase()
    }
    return value
  }
  forEach(callback, thisArg = undefined) {
    for (const name of this.keys()) {
      Reflect.apply(callback, thisArg, [this.get(name), name, this])
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name)
    }
  }
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)]
    }
  }
  [Symbol.iterator]() {
    return this.entries()
  }
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key)
      return result
    }, {})
  }
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key)
      if (key === 'host') {
        result[key] = values[0]
      } else {
        result[key] = values.length > 1 ? values : values[0]
      }
      return result
    }, {})
  }
}
Object.defineProperties(
  Headers.prototype,
  ['get', 'entries', 'forEach', 'values'].reduce((result, property) => {
    result[property] = { enumerable: true }
    return result
  }, {}),
)
function fromRawHeaders(headers = []) {
  return new Headers(
    headers
      .reduce((result, _value, index, array) => {
        if (index % 2 === 0) {
          result.push(array.slice(index, index + 2))
        }
        return result
      }, [])
      .filter(([name, value]) => {
        try {
          validateHeaderName(name)
          validateHeaderValue(name, String(value))
          return true
        } catch {
          return false
        }
      }),
  )
}

// node_modules/node-fetch/src/utils/is-redirect.js
const redirectStatus = new Set([301, 302, 303, 307, 308])
const isRedirect = (code) => {
  return redirectStatus.has(code)
}

// node_modules/node-fetch/src/response.js
const INTERNALS2 = Symbol('Response internals')

class Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options)
    const status = options.status != null ? options.status : 200
    const headers = new Headers(options.headers)
    if (body !== null && !headers.has('Content-Type')) {
      const contentType = extractContentType(body, this)
      if (contentType) {
        headers.append('Content-Type', contentType)
      }
    }
    this[INTERNALS2] = {
      type: 'default',
      url: options.url,
      status,
      statusText: options.statusText || '',
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark,
    }
  }
  get type() {
    return this[INTERNALS2].type
  }
  get url() {
    return this[INTERNALS2].url || ''
  }
  get status() {
    return this[INTERNALS2].status
  }
  get ok() {
    return this[INTERNALS2].status >= 200 && this[INTERNALS2].status < 300
  }
  get redirected() {
    return this[INTERNALS2].counter > 0
  }
  get statusText() {
    return this[INTERNALS2].statusText
  }
  get headers() {
    return this[INTERNALS2].headers
  }
  get highWaterMark() {
    return this[INTERNALS2].highWaterMark
  }
  clone() {
    return new Response(clone(this, this.highWaterMark), {
      type: this.type,
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size,
      highWaterMark: this.highWaterMark,
    })
  }
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code')
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString(),
      },
      status,
    })
  }
  static error() {
    const response = new Response(null, { status: 0, statusText: '' })
    response[INTERNALS2].type = 'error'
    return response
  }
  static json(data = undefined, init = {}) {
    const body = JSON.stringify(data)
    if (body === undefined) {
      throw new TypeError('data is not JSON serializable')
    }
    const headers = new Headers(init?.headers)
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }
    return new Response(body, {
      ...init,
      headers,
    })
  }
  get [Symbol.toStringTag]() {
    return 'Response'
  }
}
Object.defineProperties(Response.prototype, {
  type: { enumerable: true },
  url: { enumerable: true },
  status: { enumerable: true },
  ok: { enumerable: true },
  redirected: { enumerable: true },
  statusText: { enumerable: true },
  headers: { enumerable: true },
  clone: { enumerable: true },
})

// node_modules/node-fetch/src/request.js
import { format as formatUrl } from 'node:url'
import { deprecate as deprecate2 } from 'node:util'

// node_modules/node-fetch/src/utils/get-search.js
const getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search
  }
  const lastOffset = parsedURL.href.length - 1
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === '#' ? '#' : '')
  return parsedURL.href[lastOffset - hash.length] === '?' ? '?' : ''
}

// node_modules/node-fetch/src/utils/referrer.js
import { isIP } from 'node:net'

function stripURLForUseAsAReferrer(url, originOnly = false) {
  if (url == null) {
    return 'no-referrer'
  }
  url = new URL(url)
  if (/^(about|blob|data):$/.test(url.protocol)) {
    return 'no-referrer'
  }
  url.username = ''
  url.password = ''
  url.hash = ''
  if (originOnly) {
    url.pathname = ''
    url.search = ''
  }
  return url
}
const ReferrerPolicy = new Set([
  '',
  'no-referrer',
  'no-referrer-when-downgrade',
  'same-origin',
  'origin',
  'strict-origin',
  'origin-when-cross-origin',
  'strict-origin-when-cross-origin',
  'unsafe-url',
])
const DEFAULT_REFERRER_POLICY = 'strict-origin-when-cross-origin'
function validateReferrerPolicy(referrerPolicy) {
  if (!ReferrerPolicy.has(referrerPolicy)) {
    throw new TypeError(`Invalid referrerPolicy: ${referrerPolicy}`)
  }
  return referrerPolicy
}
function isOriginPotentiallyTrustworthy(url) {
  if (/^(http|ws)s:$/.test(url.protocol)) {
    return true
  }
  const hostIp = url.host.replace(/(^\[)|(]$)/g, '')
  const hostIPVersion = isIP(hostIp)
  if (hostIPVersion === 4 && /^127\./.test(hostIp)) {
    return true
  }
  if (hostIPVersion === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(hostIp)) {
    return true
  }
  if (url.host === 'localhost' || url.host.endsWith('.localhost')) {
    return false
  }
  if (url.protocol === 'file:') {
    return true
  }
  return false
}
function isUrlPotentiallyTrustworthy(url) {
  if (/^about:(blank|srcdoc)$/.test(url)) {
    return true
  }
  if (url.protocol === 'data:') {
    return true
  }
  if (/^(blob|filesystem):$/.test(url.protocol)) {
    return true
  }
  return isOriginPotentiallyTrustworthy(url)
}
function determineRequestsReferrer(request, { referrerURLCallback, referrerOriginCallback } = {}) {
  if (request.referrer === 'no-referrer' || request.referrerPolicy === '') {
    return null
  }
  const policy = request.referrerPolicy
  if (request.referrer === 'about:client') {
    return 'no-referrer'
  }
  const referrerSource = request.referrer
  let referrerURL = stripURLForUseAsAReferrer(referrerSource)
  let referrerOrigin = stripURLForUseAsAReferrer(referrerSource, true)
  if (referrerURL.toString().length > 4096) {
    referrerURL = referrerOrigin
  }
  if (referrerURLCallback) {
    referrerURL = referrerURLCallback(referrerURL)
  }
  if (referrerOriginCallback) {
    referrerOrigin = referrerOriginCallback(referrerOrigin)
  }
  const currentURL = new URL(request.url)
  switch (policy) {
    case 'no-referrer':
      return 'no-referrer'
    case 'origin':
      return referrerOrigin
    case 'unsafe-url':
      return referrerURL
    case 'strict-origin':
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return 'no-referrer'
      }
      return referrerOrigin.toString()
    case 'strict-origin-when-cross-origin':
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL
      }
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return 'no-referrer'
      }
      return referrerOrigin
    case 'same-origin':
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL
      }
      return 'no-referrer'
    case 'origin-when-cross-origin':
      if (referrerURL.origin === currentURL.origin) {
        return referrerURL
      }
      return referrerOrigin
    case 'no-referrer-when-downgrade':
      if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
        return 'no-referrer'
      }
      return referrerURL
    default:
      throw new TypeError(`Invalid referrerPolicy: ${policy}`)
  }
}
function parseReferrerPolicyFromHeader(headers) {
  const policyTokens = (headers.get('referrer-policy') || '').split(/[,\s]+/)
  let policy = ''
  for (const token of policyTokens) {
    if (token && ReferrerPolicy.has(token)) {
      policy = token
    }
  }
  return policy
}

// node_modules/node-fetch/src/request.js
const INTERNALS3 = Symbol('Request internals')
const isRequest = (object) => {
  return typeof object === 'object' && typeof object[INTERNALS3] === 'object'
}
const doBadDataWarn = deprecate2(
  () => {},
  '.data is not a valid RequestInit property, use .body instead',
  'https://github.com/node-fetch/node-fetch/issues/1000 (request)',
)

class Request extends Body {
  constructor(input, init = {}) {
    let parsedURL
    if (isRequest(input)) {
      parsedURL = new URL(input.url)
    } else {
      parsedURL = new URL(input)
      input = {}
    }
    if (parsedURL.username !== '' || parsedURL.password !== '') {
      throw new TypeError(`${parsedURL} is an url with embedded credentials.`)
    }
    let method = init.method || input.method || 'GET'
    if (/^(delete|get|head|options|post|put)$/i.test(method)) {
      method = method.toUpperCase()
    }
    if (!isRequest(init) && 'data' in init) {
      doBadDataWarn()
    }
    if (
      (init.body != null || (isRequest(input) && input.body !== null)) &&
      (method === 'GET' || method === 'HEAD')
    ) {
      throw new TypeError('Request with GET/HEAD method cannot have body')
    }
    const inputBody = init.body
      ? init.body
      : isRequest(input) && input.body !== null
        ? clone(input)
        : null
    super(inputBody, {
      size: init.size || input.size || 0,
    })
    const headers = new Headers(init.headers || input.headers || {})
    if (inputBody !== null && !headers.has('Content-Type')) {
      const contentType = extractContentType(inputBody, this)
      if (contentType) {
        headers.set('Content-Type', contentType)
      }
    }
    let signal = isRequest(input) ? input.signal : null
    if ('signal' in init) {
      signal = init.signal
    }
    if (signal != null && !isAbortSignal(signal)) {
      throw new TypeError('Expected signal to be an instanceof AbortSignal or EventTarget')
    }
    let referrer = init.referrer == null ? input.referrer : init.referrer
    if (referrer === '') {
      referrer = 'no-referrer'
    } else if (referrer) {
      const parsedReferrer = new URL(referrer)
      referrer = /^about:(\/\/)?client$/.test(parsedReferrer) ? 'client' : parsedReferrer
    } else {
      referrer = undefined
    }
    this[INTERNALS3] = {
      method,
      redirect: init.redirect || input.redirect || 'follow',
      headers,
      parsedURL,
      signal,
      referrer,
    }
    this.follow =
      init.follow === undefined ? (input.follow === undefined ? 20 : input.follow) : init.follow
    this.compress =
      init.compress === undefined
        ? input.compress === undefined
          ? true
          : input.compress
        : init.compress
    this.counter = init.counter || input.counter || 0
    this.agent = init.agent || input.agent
    this.highWaterMark = init.highWaterMark || input.highWaterMark || 16384
    this.insecureHTTPParser = init.insecureHTTPParser || input.insecureHTTPParser || false
    this.referrerPolicy = init.referrerPolicy || input.referrerPolicy || ''
  }
  get method() {
    return this[INTERNALS3].method
  }
  get url() {
    return formatUrl(this[INTERNALS3].parsedURL)
  }
  get headers() {
    return this[INTERNALS3].headers
  }
  get redirect() {
    return this[INTERNALS3].redirect
  }
  get signal() {
    return this[INTERNALS3].signal
  }
  get referrer() {
    if (this[INTERNALS3].referrer === 'no-referrer') {
      return ''
    }
    if (this[INTERNALS3].referrer === 'client') {
      return 'about:client'
    }
    if (this[INTERNALS3].referrer) {
      return this[INTERNALS3].referrer.toString()
    }
    return
  }
  get referrerPolicy() {
    return this[INTERNALS3].referrerPolicy
  }
  set referrerPolicy(referrerPolicy) {
    this[INTERNALS3].referrerPolicy = validateReferrerPolicy(referrerPolicy)
  }
  clone() {
    return new Request(this)
  }
  get [Symbol.toStringTag]() {
    return 'Request'
  }
}
Object.defineProperties(Request.prototype, {
  method: { enumerable: true },
  url: { enumerable: true },
  headers: { enumerable: true },
  redirect: { enumerable: true },
  clone: { enumerable: true },
  signal: { enumerable: true },
  referrer: { enumerable: true },
  referrerPolicy: { enumerable: true },
})
const getNodeRequestOptions = (request) => {
  const { parsedURL } = request[INTERNALS3]
  const headers = new Headers(request[INTERNALS3].headers)
  if (!headers.has('Accept')) {
    headers.set('Accept', '*/*')
  }
  let contentLengthValue = null
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = '0'
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request)
    if (typeof totalBytes === 'number' && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes)
    }
  }
  if (contentLengthValue) {
    headers.set('Content-Length', contentLengthValue)
  }
  if (request.referrerPolicy === '') {
    request.referrerPolicy = DEFAULT_REFERRER_POLICY
  }
  if (request.referrer && request.referrer !== 'no-referrer') {
    request[INTERNALS3].referrer = determineRequestsReferrer(request)
  } else {
    request[INTERNALS3].referrer = 'no-referrer'
  }
  if (request[INTERNALS3].referrer instanceof URL) {
    headers.set('Referer', request.referrer)
  }
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'node-fetch')
  }
  if (request.compress && !headers.has('Accept-Encoding')) {
    headers.set('Accept-Encoding', 'gzip, deflate, br')
  }
  let { agent } = request
  if (typeof agent === 'function') {
    agent = agent(parsedURL)
  }
  const search = getSearch(parsedURL)
  const options = {
    path: parsedURL.pathname + search,
    method: request.method,
    headers: headers[Symbol.for('nodejs.util.inspect.custom')](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent,
  }
  return {
    parsedURL,
    options,
  }
}

// node_modules/node-fetch/src/errors/abort-error.js
class AbortError extends FetchBaseError {
  constructor(message, type = 'aborted') {
    super(message, type)
  }
}

// node_modules/node-fetch/src/index.js
init_esm_min()
init_from()
const supportedSchemas = new Set(['data:', 'http:', 'https:'])
async function fetch(url, options_) {
  return new Promise((resolve, reject) => {
    const request = new Request(url, options_)
    const { parsedURL, options } = getNodeRequestOptions(request)
    if (!supportedSchemas.has(parsedURL.protocol)) {
      throw new TypeError(
        `node-fetch cannot load ${url}. URL scheme "${parsedURL.protocol.replace(/:$/, '')}" is not supported.`,
      )
    }
    if (parsedURL.protocol === 'data:') {
      const data = dist_default(request.url)
      const response2 = new Response(data, { headers: { 'Content-Type': data.typeFull } })
      resolve(response2)
      return
    }
    const send = (parsedURL.protocol === 'https:' ? https : http2).request
    const { signal } = request
    let response = null
    const abort = () => {
      const error = new AbortError('The operation was aborted.')
      reject(error)
      if (request.body && request.body instanceof Stream2.Readable) {
        request.body.destroy(error)
      }
      if (!response || !response.body) {
        return
      }
      response.body.emit('error', error)
    }
    if (signal?.aborted) {
      abort()
      return
    }
    const abortAndFinalize = () => {
      abort()
      finalize()
    }
    const request_ = send(parsedURL.toString(), options)
    if (signal) {
      signal.addEventListener('abort', abortAndFinalize)
    }
    const finalize = () => {
      request_.abort()
      if (signal) {
        signal.removeEventListener('abort', abortAndFinalize)
      }
    }
    request_.on('error', (error) => {
      reject(
        new FetchError(
          `request to ${request.url} failed, reason: ${error.message}`,
          'system',
          error,
        ),
      )
      finalize()
    })
    fixResponseChunkedTransferBadEnding(request_, (error) => {
      if (response?.body) {
        response.body.destroy(error)
      }
    })
    if (process.version < 'v14') {
      request_.on('socket', (s2) => {
        let endedWithEventsCount
        s2.prependListener('end', () => {
          endedWithEventsCount = s2._eventsCount
        })
        s2.prependListener('close', (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error = new Error('Premature close')
            error.code = 'ERR_STREAM_PREMATURE_CLOSE'
            response.body.emit('error', error)
          }
        })
      })
    }
    request_.on('response', (response_) => {
      request_.setTimeout(0)
      const headers = fromRawHeaders(response_.rawHeaders)
      if (isRedirect(response_.statusCode)) {
        const location = headers.get('Location')
        let locationURL = null
        try {
          locationURL = location === null ? null : new URL(location, request.url)
        } catch {
          if (request.redirect !== 'manual') {
            reject(
              new FetchError(
                `uri requested responds with an invalid redirect URL: ${location}`,
                'invalid-redirect',
              ),
            )
            finalize()
            return
          }
        }
        switch (request.redirect) {
          case 'error':
            reject(
              new FetchError(
                `uri requested responds with a redirect, redirect mode is set to error: ${request.url}`,
                'no-redirect',
              ),
            )
            finalize()
            return
          case 'manual':
            break
          case 'follow': {
            if (locationURL === null) {
              break
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'))
              finalize()
              return
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: clone(request),
              signal: request.signal,
              size: request.size,
              referrer: request.referrer,
              referrerPolicy: request.referrerPolicy,
            }
            if (
              !isDomainOrSubdomain(request.url, locationURL) ||
              !isSameProtocol(request.url, locationURL)
            ) {
              for (const name of ['authorization', 'www-authenticate', 'cookie', 'cookie2']) {
                requestOptions.headers.delete(name)
              }
            }
            if (
              response_.statusCode !== 303 &&
              request.body &&
              options_.body instanceof Stream2.Readable
            ) {
              reject(
                new FetchError(
                  'Cannot follow redirect with body being a readable stream',
                  'unsupported-redirect',
                ),
              )
              finalize()
              return
            }
            if (
              response_.statusCode === 303 ||
              ((response_.statusCode === 301 || response_.statusCode === 302) &&
                request.method === 'POST')
            ) {
              requestOptions.method = 'GET'
              requestOptions.body = undefined
              requestOptions.headers.delete('content-length')
            }
            const responseReferrerPolicy = parseReferrerPolicyFromHeader(headers)
            if (responseReferrerPolicy) {
              requestOptions.referrerPolicy = responseReferrerPolicy
            }
            resolve(fetch(new Request(locationURL, requestOptions)))
            finalize()
            return
          }
          default:
            return reject(
              new TypeError(
                `Redirect option '${request.redirect}' is not a valid value of RequestRedirect`,
              ),
            )
        }
      }
      if (signal) {
        response_.once('end', () => {
          signal.removeEventListener('abort', abortAndFinalize)
        })
      }
      let body = pump(response_, new PassThrough2(), (error) => {
        if (error) {
          reject(error)
        }
      })
      if (process.version < 'v12.10') {
        response_.on('aborted', abortAndFinalize)
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark,
      }
      const codings = headers.get('Content-Encoding')
      if (
        !request.compress ||
        request.method === 'HEAD' ||
        codings === null ||
        response_.statusCode === 204 ||
        response_.statusCode === 304
      ) {
        response = new Response(body, responseOptions)
        resolve(response)
        return
      }
      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH,
      }
      if (codings === 'gzip' || codings === 'x-gzip') {
        body = pump(body, zlib.createGunzip(zlibOptions), (error) => {
          if (error) {
            reject(error)
          }
        })
        response = new Response(body, responseOptions)
        resolve(response)
        return
      }
      if (codings === 'deflate' || codings === 'x-deflate') {
        const raw = pump(response_, new PassThrough2(), (error) => {
          if (error) {
            reject(error)
          }
        })
        raw.once('data', (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = pump(body, zlib.createInflate(), (error) => {
              if (error) {
                reject(error)
              }
            })
          } else {
            body = pump(body, zlib.createInflateRaw(), (error) => {
              if (error) {
                reject(error)
              }
            })
          }
          response = new Response(body, responseOptions)
          resolve(response)
        })
        raw.once('end', () => {
          if (!response) {
            response = new Response(body, responseOptions)
            resolve(response)
          }
        })
        return
      }
      if (codings === 'br') {
        body = pump(body, zlib.createBrotliDecompress(), (error) => {
          if (error) {
            reject(error)
          }
        })
        response = new Response(body, responseOptions)
        resolve(response)
        return
      }
      response = new Response(body, responseOptions)
      resolve(response)
    })
    writeToStream(request_, request).catch(reject)
  })
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer3.from(`0\r
\r
`)
  let isChunkedTransfer = false
  let properLastChunkReceived = false
  let previousChunk
  request.on('response', (response) => {
    const { headers } = response
    isChunkedTransfer = headers['transfer-encoding'] === 'chunked' && !headers['content-length']
  })
  request.on('socket', (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error = new Error('Premature close')
        error.code = 'ERR_STREAM_PREMATURE_CLOSE'
        errorCallback(error)
      }
    }
    const onData = (buf) => {
      properLastChunkReceived = Buffer3.compare(buf.slice(-5), LAST_CHUNK) === 0
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived =
          Buffer3.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 &&
          Buffer3.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0
      }
      previousChunk = buf
    }
    socket.prependListener('close', onSocketClose)
    socket.on('data', onData)
    request.on('close', () => {
      socket.removeListener('close', onSocketClose)
      socket.removeListener('data', onData)
    })
  })
}

// src/utils/config.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CONFIG_DIR = join(homedir(), '.bslog')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')
function getApiToken() {
  const token = process.env.BETTERSTACK_API_TOKEN
  if (!token) {
    throw new Error(
      `BETTERSTACK_API_TOKEN environment variable is not set.
` +
        `Please add it to your shell configuration:
` +
        'export BETTERSTACK_API_TOKEN="your_token_here"',
    )
  }
  return token
}
function loadConfig() {
  if (!existsSync(CONFIG_FILE)) {
    return {
      defaultLimit: 100,
      outputFormat: 'json',
      queryHistory: [],
      savedQueries: {},
    }
  }
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (_error) {
    console.warn('Failed to load config, using defaults')
    return {
      defaultLimit: 100,
      outputFormat: 'json',
    }
  }
}
function saveConfig(config) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}
function updateConfig(updates) {
  const config = loadConfig()
  const newConfig = { ...config, ...updates }
  saveConfig(newConfig)
}
function addToHistory(query) {
  const config = loadConfig()
  const history = config.queryHistory || []
  history.unshift(query)
  if (history.length > 100) {
    history.pop()
  }
  updateConfig({ queryHistory: history })
}

// src/api/client.ts
const TELEMETRY_BASE_URL = 'https://telemetry.betterstack.com/api/v1'
const QUERY_BASE_URL = 'https://eu-nbg-2-connect.betterstackdata.com'

class BetterStackClient {
  token
  constructor() {
    this.token = getApiToken()
  }
  async request(url, options = {}) {
    const headers = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }
    const response = await fetch(url, {
      ...options,
      headers,
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API request failed: ${response.status} - ${error}`)
    }
    return response.json()
  }
  async telemetry(path, options = {}) {
    const url = `${TELEMETRY_BASE_URL}${path}`
    return this.request(url, options)
  }
  async query(sql, username, password) {
    const auth =
      username && password
        ? Buffer.from(`${username}:${password}`).toString('base64')
        : Buffer.from(`${this.token}:`).toString('base64')
    const response = await fetch(QUERY_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'text/plain',
      },
      body: sql,
    })
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Query failed: ${response.status} - ${error}`)
    }
    const text = await response.text()
    const lines = text
      .trim()
      .split(`
`)
      .filter((line) => line.length > 0)
    return lines
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch (_e2) {
          console.error('Failed to parse line:', line)
          return null
        }
      })
      .filter(Boolean)
  }
}

// src/api/sources.ts
class SourcesAPI {
  client
  constructor() {
    this.client = new BetterStackClient()
  }
  async list(page = 1, perPage = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })
    return this.client.telemetry(`/sources?${params}`)
  }
  async listAll() {
    const sources = []
    let page = 1
    let hasMore = true
    while (hasMore) {
      const response = await this.list(page, 50)
      sources.push(...response.data)
      if (response.pagination) {
        const { total, page: currentPage, per_page } = response.pagination
        hasMore = currentPage * per_page < total
        page++
      } else {
        hasMore = false
      }
    }
    return sources
  }
  async get(sourceId) {
    const response = await this.client.telemetry(`/sources/${sourceId}`)
    return response.data
  }
  async findByName(name) {
    const sources = await this.listAll()
    return sources.find((s2) => s2.attributes.name === name) || null
  }
}

// src/utils/formatter.ts
const import_cli_table3 = __toESM(require_table(), 1)

// node_modules/chalk/source/vendor/ansi-styles/index.js
const ANSI_BACKGROUND_OFFSET = 10
const wrapAnsi16 =
  (offset = 0) =>
  (code) =>
    `\x1B[${code + offset}m`
const wrapAnsi256 =
  (offset = 0) =>
  (code) =>
    `\x1B[${38 + offset};5;${code}m`
const wrapAnsi16m =
  (offset = 0) =>
  (red, green, blue) =>
    `\x1B[${38 + offset};2;${red};${green};${blue}m`
const styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39],
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49],
  },
}
const _modifierNames = Object.keys(styles.modifier)
const foregroundColorNames = Object.keys(styles.color)
const backgroundColorNames = Object.keys(styles.bgColor)
const _colorNames = [...foregroundColorNames, ...backgroundColorNames]
function assembleStyles() {
  const codes = new Map()
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`,
      }
      group[styleName] = styles[styleName]
      codes.set(style[0], style[1])
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false,
    })
  }
  Object.defineProperty(styles, 'codes', {
    value: codes,
    enumerable: false,
  })
  styles.color.close = '\x1B[39m'
  styles.bgColor.close = '\x1B[49m'
  styles.color.ansi = wrapAnsi16()
  styles.color.ansi256 = wrapAnsi256()
  styles.color.ansi16m = wrapAnsi16m()
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET)
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET)
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET)
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16
          }
          if (red > 248) {
            return 231
          }
          return Math.round(((red - 8) / 247) * 24) + 232
        }
        return (
          16 +
          36 * Math.round((red / 255) * 5) +
          6 * Math.round((green / 255) * 5) +
          Math.round((blue / 255) * 5)
        )
      },
      enumerable: false,
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16))
        if (!matches) {
          return [0, 0, 0]
        }
        let [colorString] = matches
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join('')
        }
        const integer = Number.parseInt(colorString, 16)
        return [(integer >> 16) & 255, (integer >> 8) & 255, integer & 255]
      },
      enumerable: false,
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false,
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code
        }
        if (code < 16) {
          return 90 + (code - 8)
        }
        let red
        let green
        let blue
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255
          green = red
          blue = red
        } else {
          code -= 16
          const remainder = code % 36
          red = Math.floor(code / 36) / 5
          green = Math.floor(remainder / 6) / 5
          blue = (remainder % 6) / 5
        }
        const value = Math.max(red, green, blue) * 2
        if (value === 0) {
          return 30
        }
        let result = 30 + ((Math.round(blue) << 2) | (Math.round(green) << 1) | Math.round(red))
        if (value === 2) {
          result += 60
        }
        return result
      },
      enumerable: false,
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false,
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false,
    },
  })
  return styles
}
const ansiStyles = assembleStyles()
const ansi_styles_default = ansiStyles

import os from 'node:os'
// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from 'node:process'
import tty from 'node:tty'

function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith('-') ? '' : flag.length === 1 ? '-' : '--'
  const position = argv.indexOf(prefix + flag)
  const terminatorPosition = argv.indexOf('--')
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition)
}
const { env } = process2
let flagForceColor
if (
  hasFlag('no-color') ||
  hasFlag('no-colors') ||
  hasFlag('color=false') ||
  hasFlag('color=never')
) {
  flagForceColor = 0
} else if (
  hasFlag('color') ||
  hasFlag('colors') ||
  hasFlag('color=true') ||
  hasFlag('color=always')
) {
  flagForceColor = 1
}
function envForceColor() {
  if ('FORCE_COLOR' in env) {
    if (env.FORCE_COLOR === 'true') {
      return 1
    }
    if (env.FORCE_COLOR === 'false') {
      return 0
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3)
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3,
  }
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor()
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor
  if (forceColor === 0) {
    return 0
  }
  if (sniffFlags) {
    if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) {
      return 3
    }
    if (hasFlag('color=256')) {
      return 2
    }
  }
  if ('TF_BUILD' in env && 'AGENT_NAME' in env) {
    return 1
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0
  }
  const min = forceColor || 0
  if (env.TERM === 'dumb') {
    return min
  }
  if (process2.platform === 'win32') {
    const osRelease = os.release().split('.')
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2
    }
    return 1
  }
  if ('CI' in env) {
    if (['GITHUB_ACTIONS', 'GITEA_ACTIONS', 'CIRCLECI'].some((key) => key in env)) {
      return 3
    }
    if (
      ['TRAVIS', 'APPVEYOR', 'GITLAB_CI', 'BUILDKITE', 'DRONE'].some((sign) => sign in env) ||
      env.CI_NAME === 'codeship'
    ) {
      return 1
    }
    return min
  }
  if ('TEAMCITY_VERSION' in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0
  }
  if (env.COLORTERM === 'truecolor') {
    return 3
  }
  if (env.TERM === 'xterm-kitty') {
    return 3
  }
  if (env.TERM === 'xterm-ghostty') {
    return 3
  }
  if (env.TERM === 'wezterm') {
    return 3
  }
  if ('TERM_PROGRAM' in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10)
    switch (env.TERM_PROGRAM) {
      case 'iTerm.app': {
        return version >= 3 ? 3 : 2
      }
      case 'Apple_Terminal': {
        return 2
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1
  }
  if ('COLORTERM' in env) {
    return 1
  }
  return min
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream?.isTTY,
    ...options,
  })
  return translateLevel(level)
}
const supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) }),
}
const supports_color_default = supportsColor

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring)
  if (index === -1) {
    return string
  }
  const substringLength = substring.length
  let endIndex = 0
  let returnValue = ''
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer
    endIndex = index + substringLength
    index = string.indexOf(substring, endIndex)
  } while (index !== -1)
  returnValue += string.slice(endIndex)
  return returnValue
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0
  let returnValue = ''
  do {
    const gotCR = string[index - 1] === '\r'
    returnValue +=
      string.slice(endIndex, gotCR ? index - 1 : index) +
      prefix +
      (gotCR
        ? `\r
`
        : `
`) +
      postfix
    endIndex = index + 1
    index = string.indexOf(
      `
`,
      endIndex,
    )
  } while (index !== -1)
  returnValue += string.slice(endIndex)
  return returnValue
}

// node_modules/chalk/source/index.js
const { stdout: stdoutColor, stderr: stderrColor } = supports_color_default
const GENERATOR = Symbol('GENERATOR')
const STYLER = Symbol('STYLER')
const IS_EMPTY = Symbol('IS_EMPTY')
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m']
const styles2 = Object.create(null)
const applyOptions = (object, options = {}) => {
  if (
    options.level &&
    !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)
  ) {
    throw new Error('The `level` option should be an integer from 0 to 3')
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0
  object.level = options.level === undefined ? colorLevel : options.level
}
const chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(' ')
  applyOptions(chalk, options)
  Object.setPrototypeOf(chalk, createChalk.prototype)
  return chalk
}
function createChalk(options) {
  return chalkFactory(options)
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype)
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(
        this,
        createStyler(style.open, style.close, this[STYLER]),
        this[IS_EMPTY],
      )
      Object.defineProperty(this, styleName, { value: builder })
      return builder
    },
  }
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true)
    Object.defineProperty(this, 'visible', { value: builder })
    return builder
  },
}
const getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === 'rgb') {
    if (level === 'ansi16m') {
      return ansi_styles_default[type].ansi16m(...arguments_)
    }
    if (level === 'ansi256') {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_))
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_))
  }
  if (model === 'hex') {
    return getModelAnsi('rgb', level, type, ...ansi_styles_default.hexToRgb(...arguments_))
  }
  return ansi_styles_default[type][model](...arguments_)
}
const usedModels = ['rgb', 'hex', 'ansi256']
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this
      return function (...arguments_) {
        const styler = createStyler(
          getModelAnsi(model, levelMapping[level], 'color', ...arguments_),
          ansi_styles_default.color.close,
          this[STYLER],
        )
        return createBuilder(this, styler, this[IS_EMPTY])
      }
    },
  }
  const bgModel = `bg${model[0].toUpperCase()}${model.slice(1)}`
  styles2[bgModel] = {
    get() {
      const { level } = this
      return function (...arguments_) {
        const styler = createStyler(
          getModelAnsi(model, levelMapping[level], 'bgColor', ...arguments_),
          ansi_styles_default.bgColor.close,
          this[STYLER],
        )
        return createBuilder(this, styler, this[IS_EMPTY])
      }
    },
  }
}
const proto = Object.defineProperties(() => {}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level
    },
    set(level) {
      this[GENERATOR].level = level
    },
  },
})
const createStyler = (open, close, parent) => {
  let openAll
  let closeAll
  if (parent === undefined) {
    openAll = open
    closeAll = close
  } else {
    openAll = parent.openAll + open
    closeAll = close + parent.closeAll
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent,
  }
}
const createBuilder = (self2, _styler, _isEmpty) => {
  const builder = (...arguments_) =>
    applyStyle(builder, arguments_.length === 1 ? `${arguments_[0]}` : arguments_.join(' '))
  Object.setPrototypeOf(builder, proto)
  builder[GENERATOR] = self2
  builder[STYLER] = _styler
  builder[IS_EMPTY] = _isEmpty
  return builder
}
const applyStyle = (self2, string) => {
  if (self2.level <= 0 || !string) {
    return self2[IS_EMPTY] ? '' : string
  }
  let styler = self2[STYLER]
  if (styler === undefined) {
    return string
  }
  const { openAll, closeAll } = styler
  if (string.includes('\x1B')) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open)
      styler = styler.parent
    }
  }
  const lfIndex = string.indexOf(`
`)
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex)
  }
  return openAll + string + closeAll
}
Object.defineProperties(createChalk.prototype, styles2)
const chalk = createChalk()
const _chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 })
const source_default = chalk

// src/utils/formatter.ts
function formatOutput(data, format = 'json') {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2)
    case 'pretty':
      return formatPretty(data)
    case 'table':
      return formatTable(data)
    case 'csv':
      return formatCSV(data)
    default:
      return JSON.stringify(data, null, 2)
  }
}
function formatPretty(data) {
  const output = []
  for (const entry of data) {
    const timestamp = source_default.gray(entry.dt || 'No timestamp')
    let level = entry.level || extractLevel(entry)
    if (level) {
      switch (level.toLowerCase()) {
        case 'error':
        case 'fatal':
          level = source_default.red(level.toUpperCase())
          break
        case 'warn':
        case 'warning':
          level = source_default.yellow(level.toUpperCase())
          break
        case 'info':
          level = source_default.blue(level.toUpperCase())
          break
        case 'debug':
          level = source_default.gray(level.toUpperCase())
          break
        default:
          level = source_default.white(level.toUpperCase())
      }
    } else {
      level = source_default.gray('LOG')
    }
    const message = extractMessage(entry)
    const subsystem = entry.subsystem || extractSubsystem(entry)
    let line = `[${timestamp}] ${level}`
    if (subsystem) {
      line += ` ${source_default.cyan(`[${subsystem}]`)}`
    }
    line += ` ${message}`
    output.push(line)
    const extraFields = getExtraFields(entry)
    if (Object.keys(extraFields).length > 0) {
      const extras = Object.entries(extraFields)
        .map(([key, value]) => `  ${source_default.gray(key)}: ${formatValue(value)}`)
        .join(`
`)
      output.push(extras)
    }
  }
  return output.join(`
`)
}
function formatTable(data) {
  if (data.length === 0) {
    return 'No results found'
  }
  const allKeys = new Set()
  for (const entry of data) {
    Object.keys(entry).forEach((key) => allKeys.add(key))
  }
  const headers = Array.from(allKeys)
  const table = new import_cli_table3.default({
    head: headers,
    wordWrap: true,
    colWidths: headers.map((h2) => {
      if (h2 === 'dt') {
        return 20
      }
      if (h2 === 'raw') {
        return 50
      }
      if (h2 === 'message') {
        return 40
      }
      return null
    }),
  })
  for (const entry of data) {
    const row = headers.map((header) => {
      const value = entry[header]
      if (value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        return JSON.stringify(value)
      }
      return String(value)
    })
    table.push(row)
  }
  return table.toString()
}
function formatCSV(data) {
  if (data.length === 0) {
    return ''
  }
  const allKeys = new Set()
  for (const entry of data) {
    Object.keys(entry).forEach((key) => allKeys.add(key))
  }
  const headers = Array.from(allKeys)
  const lines = []
  lines.push(headers.map((h2) => escapeCSV(h2)).join(','))
  for (const entry of data) {
    const row = headers.map((header) => {
      const value = entry[header]
      if (value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        return escapeCSV(JSON.stringify(value))
      }
      return escapeCSV(String(value))
    })
    lines.push(row.join(','))
  }
  return lines.join(`
`)
}
function escapeCSV(value) {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes(`
`)
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
function extractLevel(entry) {
  if (entry.level) {
    return entry.level
  }
  if (entry.raw) {
    try {
      const parsed = typeof entry.raw === 'string' ? JSON.parse(entry.raw) : entry.raw
      return parsed.level || parsed.severity || null
    } catch {
      const match = entry.raw.match(/\b(ERROR|WARN|WARNING|INFO|DEBUG|FATAL)\b/i)
      return match ? match[1] : null
    }
  }
  return null
}
function extractMessage(entry) {
  if (entry.message) {
    return entry.message
  }
  if (entry.raw) {
    try {
      const parsed = typeof entry.raw === 'string' ? JSON.parse(entry.raw) : entry.raw
      return parsed.message || parsed.msg || JSON.stringify(parsed)
    } catch {
      return entry.raw
    }
  }
  return JSON.stringify(entry)
}
function extractSubsystem(entry) {
  if (entry.subsystem) {
    return entry.subsystem
  }
  if (entry.raw) {
    try {
      const parsed = typeof entry.raw === 'string' ? JSON.parse(entry.raw) : entry.raw
      return parsed.subsystem || parsed.service || parsed.component || null
    } catch {
      return null
    }
  }
  return null
}
function getExtraFields(entry) {
  const exclude = ['dt', 'raw', 'level', 'message', 'subsystem']
  const extras = {}
  for (const [key, value] of Object.entries(entry)) {
    if (!exclude.includes(key)) {
      extras[key] = value
    }
  }
  return extras
}
function formatValue(value) {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// src/commands/sources.ts
async function listSources(options) {
  const api = new SourcesAPI()
  try {
    const sources = await api.listAll()
    if (options.format === 'table' || options.format === 'pretty') {
      console.log(
        source_default.bold(`
Available Sources:
`),
      )
      for (const source of sources) {
        const { name, platform, messages_count, bytes_count, ingesting_paused } = source.attributes
        console.log(source_default.cyan(`  ${name}`))
        console.log(`    Platform: ${platform}`)
        console.log(`    Messages: ${messages_count ? messages_count.toLocaleString() : '0'}`)
        console.log(`    Size: ${formatBytes(bytes_count || 0)}`)
        console.log(
          `    Status: ${ingesting_paused ? source_default.red('Paused') : source_default.green('Active')}`,
        )
        console.log(`    ID: ${source.id}`)
        console.log()
      }
    } else {
      const output = formatOutput(sources, options.format || 'json')
      console.log(output)
    }
  } catch (error) {
    console.error(source_default.red(`Error listing sources: ${error.message}`))
    process.exit(1)
  }
}
async function getSource(name, options) {
  const api = new SourcesAPI()
  try {
    const source = await api.findByName(name)
    if (!source) {
      console.error(source_default.red(`Source not found: ${name}`))
      process.exit(1)
    }
    if (options.format === 'pretty') {
      const { attributes } = source
      console.log(
        source_default.bold(`
Source: ${attributes.name}
`),
      )
      console.log(`ID: ${source.id}`)
      console.log(`Platform: ${attributes.platform}`)
      console.log(`Token: ${attributes.token ? `${attributes.token.substring(0, 10)}...` : 'N/A'}`)
      console.log(
        `Messages: ${attributes.messages_count ? attributes.messages_count.toLocaleString() : '0'}`,
      )
      console.log(`Size: ${formatBytes(attributes.bytes_count || 0)}`)
      console.log(
        `Status: ${attributes.ingesting_paused ? source_default.red('Paused') : source_default.green('Active')}`,
      )
      console.log(
        `Created: ${attributes.created_at ? new Date(attributes.created_at).toLocaleString() : 'N/A'}`,
      )
      console.log(
        `Updated: ${attributes.updated_at ? new Date(attributes.updated_at).toLocaleString() : 'N/A'}`,
      )
    } else {
      const output = formatOutput([source], options.format || 'json')
      console.log(output)
    }
  } catch (error) {
    console.error(source_default.red(`Error getting source: ${error.message}`))
    process.exit(1)
  }
}
function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Bytes'
  }
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i2 = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i2).toFixed(2)} ${sizes[i2]}`
}

// src/utils/time.ts
function parseTimeString(timeStr) {
  const now = new Date()
  const relativeMatch = timeStr.match(/^(\d+)([hdmw])$/)
  if (relativeMatch) {
    const [, amount, unit] = relativeMatch
    const value = Number.parseInt(amount, 10)
    switch (unit) {
      case 'h':
        return new Date(now.getTime() - value * 60 * 60 * 1000)
      case 'd':
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000)
      case 'm':
        return new Date(now.getTime() - value * 60 * 1000)
      case 'w':
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000)
      default:
        throw new Error(`Unknown time unit: ${unit}`)
    }
  }
  const date = new Date(timeStr)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid time format: ${timeStr}`)
  }
  return date
}
function toClickHouseDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// src/api/query.ts
class QueryAPI {
  client
  sourcesAPI
  constructor() {
    this.client = new BetterStackClient()
    this.sourcesAPI = new SourcesAPI()
  }
  async buildQuery(options) {
    const config = loadConfig()
    const sourceName = options.source || config.defaultSource
    if (!sourceName) {
      throw new Error(
        'No source specified. Use --source or set a default source with: bslog config source <name>',
      )
    }
    const source = await this.sourcesAPI.findByName(sourceName)
    if (!source) {
      throw new Error(`Source not found: ${sourceName}`)
    }
    const tableName = `t${source.id}_${sourceName.replace(/-/g, '_')}_logs`
    const fields =
      options.fields && options.fields.length > 0
        ? this.buildFieldSelection(options.fields)
        : 'dt, raw'
    let sql = `SELECT ${fields} FROM remote(${tableName})`
    const conditions = []
    if (options.since) {
      const sinceDate = parseTimeString(options.since)
      conditions.push(`dt >= toDateTime64('${toClickHouseDateTime(sinceDate)}', 3)`)
    }
    if (options.until) {
      const untilDate = parseTimeString(options.until)
      conditions.push(`dt <= toDateTime64('${toClickHouseDateTime(untilDate)}', 3)`)
    }
    if (options.level) {
      conditions.push(`getJSON(raw, 'level') = '${options.level}'`)
    }
    if (options.subsystem) {
      conditions.push(`getJSON(raw, 'subsystem') = '${options.subsystem}'`)
    }
    if (options.search) {
      conditions.push(`raw LIKE '%${options.search.replace(/'/g, "''")}%'`)
    }
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (typeof value === 'string') {
          conditions.push(`getJSON(raw, '${key}') = '${value}'`)
        } else {
          conditions.push(`getJSON(raw, '${key}') = '${JSON.stringify(value)}'`)
        }
      }
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ' ORDER BY dt DESC'
    sql += ` LIMIT ${options.limit || config.defaultLimit || 100}`
    sql += ' FORMAT JSONEachRow'
    return sql
  }
  buildFieldSelection(fields) {
    const selections = ['dt']
    for (const field of fields) {
      if (field === '*' || field === 'raw') {
        selections.push('raw')
      } else if (field === 'dt') {
      } else {
        selections.push(`getJSON(raw, '${field}') as ${field}`)
      }
    }
    return selections.join(', ')
  }
  async execute(options) {
    const sql = await this.buildQuery(options)
    console.error(`Executing query: ${sql}`)
    return this.client.query(sql)
  }
  async executeSql(sql) {
    if (!sql.toLowerCase().includes('format')) {
      sql += ' FORMAT JSONEachRow'
    }
    return this.client.query(sql)
  }
}

// src/parser/graphql.ts
function parseGraphQLQuery(query) {
  query = query.trim()
  if (query.startsWith('{') && query.endsWith('}')) {
    query = query.slice(1, -1).trim()
  }
  const logsMatch = query.match(/logs\s*\((.*?)\)\s*\{(.*?)\}/s)
  if (!logsMatch) {
    throw new Error('Invalid query format. Expected: { logs(...) { ... } }')
  }
  const [, argsStr, fieldsStr] = logsMatch
  const options = {}
  if (argsStr) {
    const args = parseArguments(argsStr)
    if (args.limit !== undefined) {
      options.limit = Number.parseInt(args.limit, 10)
    }
    if (args.level) {
      options.level = args.level
    }
    if (args.subsystem) {
      options.subsystem = args.subsystem
    }
    if (args.since) {
      options.since = args.since
    }
    if (args.until) {
      options.until = args.until
    }
    if (args.between && Array.isArray(args.between) && args.between.length === 2) {
      options.since = args.between[0]
      options.until = args.between[1]
    }
    if (args.search) {
      options.search = args.search
    }
    if (args.where && typeof args.where === 'object') {
      options.where = args.where
    }
    if (args.source) {
      options.source = args.source
    }
  }
  if (fieldsStr) {
    const fields = fieldsStr
      .split(',')
      .map((f3) => f3.trim())
      .filter((f3) => f3.length > 0)
    if (fields.length > 0 && fields[0] !== '*') {
      options.fields = fields
    }
  }
  return options
}
function parseArguments(argsStr) {
  const result = {}
  let currentKey = ''
  let currentValue = ''
  let depth = 0
  let inString = false
  let stringChar = ''
  for (let i2 = 0; i2 < argsStr.length; i2++) {
    const char = argsStr[i2]
    if (inString) {
      if (char === stringChar && argsStr[i2 - 1] !== '\\') {
        inString = false
      }
      currentValue += char
    } else if (char === '"' || char === "'") {
      inString = true
      stringChar = char
      currentValue += char
    } else if (char === '{' || char === '[') {
      depth++
      currentValue += char
    } else if (char === '}' || char === ']') {
      depth--
      currentValue += char
    } else if (char === ':' && depth === 0 && !currentKey) {
      currentKey = currentValue.trim()
      currentValue = ''
    } else if (char === ',' && depth === 0) {
      if (currentKey) {
        result[currentKey] = parseValue(currentValue.trim())
        currentKey = ''
        currentValue = ''
      }
    } else {
      currentValue += char
    }
  }
  if (currentKey && currentValue) {
    result[currentKey] = parseValue(currentValue.trim())
  }
  return result
}
function parseValue(value) {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1)
  }
  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10)
  }
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  if (value.startsWith('{') && value.endsWith('}')) {
    try {
      const objStr = value.slice(1, -1)
      const obj = {}
      const pairs = objStr.split(',')
      for (const pair of pairs) {
        const [key, val] = pair.split(':').map((s2) => s2.trim())
        if (key && val) {
          obj[key] = parseValue(val)
        }
      }
      return obj
    } catch {
      return value
    }
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      const arrStr = value.slice(1, -1)
      return arrStr.split(',').map((s2) => parseValue(s2.trim()))
    } catch {
      return value
    }
  }
  return value
}

// src/commands/query.ts
async function runQuery(queryStr, options) {
  const api = new QueryAPI()
  try {
    const queryOptions = parseGraphQLQuery(queryStr)
    const finalOptions = {
      ...queryOptions,
      ...options,
    }
    addToHistory(queryStr)
    const results = await api.execute(finalOptions)
    const output = formatOutput(results, options.format || 'pretty')
    console.log(output)
    if (results.length === 0) {
      console.error(
        source_default.yellow(`
No results found`),
      )
    } else {
      console.error(
        source_default.gray(`
${results.length} results returned`),
      )
    }
  } catch (error) {
    console.error(source_default.red(`Query error: ${error.message}`))
    process.exit(1)
  }
}
async function runSql(sql, options) {
  const api = new QueryAPI()
  try {
    addToHistory(`SQL: ${sql}`)
    const results = await api.executeSql(sql)
    const output = formatOutput(results, options.format || 'json')
    console.log(output)
    if (results.length === 0) {
      console.error(
        source_default.yellow(`
No results found`),
      )
    } else {
      console.error(
        source_default.gray(`
${results.length} results returned`),
      )
    }
  } catch (error) {
    console.error(source_default.red(`SQL error: ${error.message}`))
    process.exit(1)
  }
}

// src/commands/tail.ts
async function tailLogs(options) {
  const api = new QueryAPI()
  if (!options.limit) {
    options.limit = 100
  }
  try {
    let lastTimestamp = null
    const results = await api.execute(options)
    if (results.length > 0) {
      const output = formatOutput(results, options.format || 'pretty')
      console.log(output)
      lastTimestamp = results[0].dt
    }
    if (options.follow) {
      console.error(
        source_default.gray(`
Following logs... (Press Ctrl+C to stop)`),
      )
      const interval = options.interval || 2000
      setInterval(async () => {
        try {
          const pollOptions = {
            ...options,
            limit: 50,
            since: lastTimestamp || '1m',
          }
          const newResults = await api.execute(pollOptions)
          if (newResults.length > 0) {
            const filtered = lastTimestamp
              ? newResults.filter((r2) => r2.dt > lastTimestamp)
              : newResults
            if (filtered.length > 0) {
              const output = formatOutput(filtered, options.format || 'pretty')
              console.log(output)
              lastTimestamp = filtered[0].dt
            }
          }
        } catch (error) {
          console.error(source_default.red(`Polling error: ${error.message}`))
        }
      }, interval)
      process.stdin.resume()
    }
  } catch (error) {
    console.error(source_default.red(`Tail error: ${error.message}`))
    process.exit(1)
  }
}
async function showErrors(options) {
  return tailLogs({
    ...options,
    level: 'error',
  })
}
async function showWarnings(options) {
  return tailLogs({
    ...options,
    level: 'warning',
  })
}
async function searchLogs(pattern, options) {
  return tailLogs({
    ...options,
    search: pattern,
  })
}

// src/commands/config.ts
function setConfig(key, value) {
  const validKeys = ['source', 'limit', 'format']
  if (!validKeys.includes(key)) {
    console.error(source_default.red(`Invalid config key: ${key}`))
    console.error(`Valid keys: ${validKeys.join(', ')}`)
    process.exit(1)
  }
  switch (key) {
    case 'source':
      updateConfig({ defaultSource: value })
      console.log(source_default.green(`Default source set to: ${value}`))
      break
    case 'limit': {
      const limit = Number.parseInt(value, 10)
      if (Number.isNaN(limit) || limit < 1) {
        console.error(source_default.red('Limit must be a positive number'))
        process.exit(1)
      }
      updateConfig({ defaultLimit: limit })
      console.log(source_default.green(`Default limit set to: ${limit}`))
      break
    }
    case 'format': {
      const validFormats = ['json', 'table', 'csv', 'pretty']
      if (!validFormats.includes(value)) {
        console.error(source_default.red(`Invalid format: ${value}`))
        console.error(`Valid formats: ${validFormats.join(', ')}`)
        process.exit(1)
      }
      updateConfig({ outputFormat: value })
      console.log(source_default.green(`Default output format set to: ${value}`))
      break
    }
  }
}
function showConfig() {
  const config = loadConfig()
  console.log(
    source_default.bold(`
Current Configuration:
`),
  )
  console.log(`Default Source: ${config.defaultSource || source_default.gray('(not set)')}`)
  console.log(`Default Limit: ${config.defaultLimit || 100}`)
  console.log(`Output Format: ${config.outputFormat || 'json'}`)
  if (config.savedQueries && Object.keys(config.savedQueries).length > 0) {
    console.log(
      source_default.bold(`
Saved Queries:`),
    )
    for (const [name, query] of Object.entries(config.savedQueries)) {
      console.log(`  ${source_default.cyan(name)}: ${query}`)
    }
  }
  console.log()
}

// node_modules/chalk/source/index.js
const { stdout: stdoutColor2, stderr: stderrColor2 } = supports_color_default
const GENERATOR2 = Symbol('GENERATOR')
const STYLER2 = Symbol('STYLER')
const IS_EMPTY2 = Symbol('IS_EMPTY')
const levelMapping2 = ['ansi', 'ansi', 'ansi256', 'ansi16m']
const styles3 = Object.create(null)
const applyOptions2 = (object, options = {}) => {
  if (
    options.level &&
    !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)
  ) {
    throw new Error('The `level` option should be an integer from 0 to 3')
  }
  const colorLevel = stdoutColor2 ? stdoutColor2.level : 0
  object.level = options.level === undefined ? colorLevel : options.level
}
const chalkFactory2 = (options) => {
  const chalk2 = (...strings) => strings.join(' ')
  applyOptions2(chalk2, options)
  Object.setPrototypeOf(chalk2, createChalk2.prototype)
  return chalk2
}
function createChalk2(options) {
  return chalkFactory2(options)
}
Object.setPrototypeOf(createChalk2.prototype, Function.prototype)
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles3[styleName] = {
    get() {
      const builder = createBuilder2(
        this,
        createStyler2(style.open, style.close, this[STYLER2]),
        this[IS_EMPTY2],
      )
      Object.defineProperty(this, styleName, { value: builder })
      return builder
    },
  }
}
styles3.visible = {
  get() {
    const builder = createBuilder2(this, this[STYLER2], true)
    Object.defineProperty(this, 'visible', { value: builder })
    return builder
  },
}
const getModelAnsi2 = (model, level, type, ...arguments_) => {
  if (model === 'rgb') {
    if (level === 'ansi16m') {
      return ansi_styles_default[type].ansi16m(...arguments_)
    }
    if (level === 'ansi256') {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_))
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_))
  }
  if (model === 'hex') {
    return getModelAnsi2('rgb', level, type, ...ansi_styles_default.hexToRgb(...arguments_))
  }
  return ansi_styles_default[type][model](...arguments_)
}
const usedModels2 = ['rgb', 'hex', 'ansi256']
for (const model of usedModels2) {
  styles3[model] = {
    get() {
      const { level } = this
      return function (...arguments_) {
        const styler = createStyler2(
          getModelAnsi2(model, levelMapping2[level], 'color', ...arguments_),
          ansi_styles_default.color.close,
          this[STYLER2],
        )
        return createBuilder2(this, styler, this[IS_EMPTY2])
      }
    },
  }
  const bgModel = `bg${model[0].toUpperCase()}${model.slice(1)}`
  styles3[bgModel] = {
    get() {
      const { level } = this
      return function (...arguments_) {
        const styler = createStyler2(
          getModelAnsi2(model, levelMapping2[level], 'bgColor', ...arguments_),
          ansi_styles_default.bgColor.close,
          this[STYLER2],
        )
        return createBuilder2(this, styler, this[IS_EMPTY2])
      }
    },
  }
}
const proto2 = Object.defineProperties(() => {}, {
  ...styles3,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR2].level
    },
    set(level) {
      this[GENERATOR2].level = level
    },
  },
})
const createStyler2 = (open, close, parent) => {
  let openAll
  let closeAll
  if (parent === undefined) {
    openAll = open
    closeAll = close
  } else {
    openAll = parent.openAll + open
    closeAll = close + parent.closeAll
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent,
  }
}
const createBuilder2 = (self2, _styler, _isEmpty) => {
  const builder = (...arguments_) =>
    applyStyle2(builder, arguments_.length === 1 ? `${arguments_[0]}` : arguments_.join(' '))
  Object.setPrototypeOf(builder, proto2)
  builder[GENERATOR2] = self2
  builder[STYLER2] = _styler
  builder[IS_EMPTY2] = _isEmpty
  return builder
}
const applyStyle2 = (self2, string) => {
  if (self2.level <= 0 || !string) {
    return self2[IS_EMPTY2] ? '' : string
  }
  let styler = self2[STYLER2]
  if (styler === undefined) {
    return string
  }
  const { openAll, closeAll } = styler
  if (string.includes('\x1B')) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open)
      styler = styler.parent
    }
  }
  const lfIndex = string.indexOf(`
`)
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex)
  }
  return openAll + string + closeAll
}
Object.defineProperties(createChalk2.prototype, styles3)
const chalk2 = createChalk2()
const _chalkStderr2 = createChalk2({ level: stderrColor2 ? stderrColor2.level : 0 })
const source_default2 = chalk2

// src/index.ts
const import_dotenv = __toESM(require_main(), 1)
import_dotenv.default.config()
const program2 = new Command()
program2
  .name('bslog')
  .description('Better Stack log query CLI with GraphQL-inspired syntax')
  .version('1.0.0')
program2
  .command('query')
  .argument('<query>', 'GraphQL-like query string')
  .option('-s, --source <name>', 'Source name')
  .option('-f, --format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Query logs using GraphQL-like syntax')
  .action(async (query, options) => {
    await runQuery(query, options)
  })
program2
  .command('sql')
  .argument('<sql>', 'Raw ClickHouse SQL query')
  .option('-f, --format <type>', 'Output format (json|table|csv|pretty)', 'json')
  .description('Execute raw ClickHouse SQL query')
  .action(async (sql, options) => {
    await runSql(sql, options)
  })
program2
  .command('tail')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('-l, --level <level>', 'Filter by log level')
  .option('--subsystem <name>', 'Filter by subsystem')
  .option('--since <time>', 'Show logs since (e.g., 1h, 2d, 2024-01-01)')
  .option('-f, --follow', 'Follow log output')
  .option('--interval <ms>', 'Polling interval in milliseconds', '2000')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Tail logs (similar to tail -f)')
  .action(async (options) => {
    await tailLogs({
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })
program2
  .command('errors')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('--since <time>', 'Show errors since (e.g., 1h, 2d)')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Show only error logs')
  .action(async (options) => {
    await showErrors({
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })
program2
  .command('warnings')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('--since <time>', 'Show warnings since (e.g., 1h, 2d)')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Show only warning logs')
  .action(async (options) => {
    await showWarnings({
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })
program2
  .command('search')
  .argument('<pattern>', 'Search pattern')
  .option('-n, --limit <number>', 'Number of logs to fetch', '100')
  .option('-s, --source <name>', 'Source name')
  .option('-l, --level <level>', 'Filter by log level')
  .option('--since <time>', 'Search logs since (e.g., 1h, 2d)')
  .option('--format <type>', 'Output format (json|table|csv|pretty)', 'pretty')
  .description('Search logs for a pattern')
  .action(async (pattern, options) => {
    await searchLogs(pattern, {
      ...options,
      limit: Number.parseInt(options.limit, 10),
    })
  })
const sources = program2.command('sources').description('Manage log sources')
sources
  .command('list')
  .option('-f, --format <type>', 'Output format (json|table|pretty)', 'pretty')
  .description('List all available sources')
  .action(async (options) => {
    await listSources(options)
  })
sources
  .command('get')
  .argument('<name>', 'Source name')
  .option('-f, --format <type>', 'Output format (json|pretty)', 'pretty')
  .description('Get details about a specific source')
  .action(async (name, options) => {
    await getSource(name, options)
  })
const config = program2.command('config').description('Manage configuration')
config
  .command('set')
  .argument('<key>', 'Configuration key (source|limit|format)')
  .argument('<value>', 'Configuration value')
  .description('Set a configuration value')
  .action((key, value) => {
    setConfig(key, value)
  })
config
  .command('show')
  .description('Show current configuration')
  .action(() => {
    showConfig()
  })
config
  .command('source')
  .argument('<name>', 'Source name')
  .description('Set default source (shorthand for config set source)')
  .action((name) => {
    setConfig('source', name)
  })
program2.on('--help', () => {
  console.log('')
  console.log(source_default2.bold('Examples:'))
  console.log('')
  console.log('  # GraphQL-like queries:')
  console.log('  $ bslog query "{ logs(limit: 100) { dt, level, message } }"')
  console.log(`  $ bslog query "{ logs(level: 'error', since: '1h') { * } }"`)
  console.log(`  $ bslog query "{ logs(where: { subsystem: 'api' }) { dt, message } }"`)
  console.log('')
  console.log('  # Simple commands:')
  console.log('  $ bslog tail -n 50                    # Last 50 logs')
  console.log('  $ bslog tail -f                       # Follow logs')
  console.log('  $ bslog errors --since 1h             # Errors from last hour')
  console.log('  $ bslog search "authentication failed"')
  console.log('')
  console.log('  # Sources:')
  console.log('  $ bslog sources list                  # List all sources')
  console.log('  $ bslog config source sweetistics-dev # Set default source')
  console.log('')
  console.log('  # Raw SQL:')
  console.log('  $ bslog sql "SELECT * FROM remote(t123_logs) LIMIT 10"')
})
program2.parse()
if (program2.args.length === 0) {
  program2.help()
}

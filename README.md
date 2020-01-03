# ce-helper

This extension is specific to CovenantEyes Developers. Specifically, it helps to smooth over some operations with `zarf`, `waf`, and `wafexec`.

## Features

### Commands

The extension has a command tree view that allows clickable command execution for systems such as:

#### waf

![waf configure](images/waf_configure.gif)

#### Building Individual Zarf Modules

![build zarf module](images/build_individual_zarf_module.gif)

#### NPM Script Via wafexec

![wafexec npm](images/run_npm_script.gif)

Scaffolder-based projects also have common commands "bubbled" up to the top of the list. Additional project types may be recognized in the future.

![bubbled commands](images/bubbled_commands.png)

#### Command Management

Tasks started from the menu can be killed at any time.

![kill task](images/kill_task.gif)

Currently, only one task may be run at a time from the menu.

![single task](images/single_task.gif)

### Acquiring Zarf

When opening a freshly-cloned project that requires zarf, an option is presented to grab it automatically based on the `wscript`.

![clone zarf tag](images/clone_zarf_tag.gif)

It also works if `zarf` is a submodule.

![get submodules](images/git_submodules.gif)

### Tasks

The three command types are implemented via VSCode Tasks, and each discovered operation is also registered as a task with a fixed name, so they can be used from non-gui VSCode settings.

- Waf tasks have the schema `waf: <command>`.
- Zarf submodules have the schema `zarf: build <relative/folder/path>`
- Wafexec-NPM scripts have the schema `wnpm: <project>/<script-name>`

For example, you can use a zarf build task in a debugger configuration:

![zarf debug](images/zarf_prebuild_task.gif)

## Known Issues

Task definitions are not particularly robust, as they lack properties. This means that tasks cannot be used via the `tasks.json` file, and everything is reliant on the fully-resolved tasks found automatically on extension startup.

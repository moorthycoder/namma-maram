# Project Architectural Mandates

This file serves as a foundational mandate for the Money Manager App project. All agents (AI or human) must adhere to these rules.

## diagnosis

Before editing any file, follow this process:

1. Diagnose – Identify the issue and root cause
2. Result – State what was found
3. Action – Describe what should be done
4. Code – Show the proposed code change
5. Approve – Wait for developer approval before editing

## Permission

- always seek permission before touching the code
- do one change at a time
- Without expilcit permission from developer, not a sigle char can be modified
- only do code replacement as approved by the developer
- never ever do write_file. you are explicitly prohibited from write_file
- After modification, check whether it is done as per chart out plan. If not as per plan, iterate the process
- never process cancelled request
- never ever do git related (add, restore, reset, checkout, etc) without explicit asking yes/no from developer. only proceed after getting explicit yes.
- you are just another garbage ai code editor. so, never attempt to write code on your own in this project as it is aversion of garbage code

## CSS

- always do class based css, no inline based targeting
- no id based targeting for css
- always 16px as html base font size

## naming

- funtion name should be self explantory, even if it is lengthy
- funtion should do only one action and return only one value, if applicable.
- function name should be in camelCase
- variable names should be in snake_case

## if use

- always prefer ternary funtion over if for simple comparison
- never go more than 2 deep if nest

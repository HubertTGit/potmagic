Run `git status` and `git diff` to understand all staged and unstaged changes.

Generate a single-line commit message that summarizes the changes concisely.

Show the user the proposed commit message.

Never add Claude as a co-author to any commit message.

If the argument "STOP" is provided, do NOT commit. Only show the proposed commit message.

Otherwise, commit with:
```
git add -A && git commit -m "<one-line message>"
```

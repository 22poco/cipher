# development workflow

## goal

use ai as a helper, not as autopilot.

before asking for implementation help, write down:

- what you are trying to build
- what files you think are involved
- what data moves between frontend, backend, and database
- what success looks like

## daily workflow

1. read the relevant files first
2. write a short plan in your own words
3. ask ai to review or improve the plan
4. implement one small piece
5. run the app
6. test the behavior manually
7. write down what broke or confused you
8. only then ask ai for help fixing the specific issue

## branch workflow

for new work:

```powershell
git switch main
git pull origin main
git switch -c feature/name-of-work
```

after the work is done:

```powershell
git status
git add .
git commit -m "short lowercase message"
git push -u origin feature/name-of-work
```

then open a pull request into `main`.

after merging:

```powershell
git switch main
git pull origin main
git branch -d feature/name-of-work
```

keep the remote branch if you want a visible record on github.

## ai rules

- ask ai to explain changes in plain language
- ask ai to point to exact files
- do not accept code you cannot roughly explain
- if ai edits a file, read the diff before committing
- if you do not understand a file, add notes before moving on

## testing checklist

before merging a feature:

- run frontend lint
- run frontend build
- start postgres
- start fastapi
- start next.js
- test the main user flow in a browser
- check `git status`
- read the diff

# Workspace Rules

- **Git Backend Deployments**: Whenever you make a change to anything in the backend, you MUST automatically save it and push it to git *from the `backend` directory*. This project uses a separate git repository in the backend folder to trigger updates. Run `git add .`, `git commit -m "..."`, and `git push` inside `c:\Code\hezi.ai\backend` as part of your execution without waiting for an explicit prompt.

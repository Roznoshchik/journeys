# journeys
This repo uses Flask on the backend and is still undecided on the frontend.

We've set up pre-commit to ensure style and consistency with bandit, flake8, and black
To get setup do the following

1. `python3 -m venv venv` # if you haven't done so already

2. `. venv/bin/activate`

3. `pip install -r server/requirements-dev.txt`

4. `cd.. && pre-commit install`

This will then run with every commit and refuse the commit if any of the hooks fail.
To skip this, in the case of wip commits, you can do so with:

`git commit --no-verify -m "message"`

You can also run the pre-commit hooks manually with

`pre-commit run --all-files`

This will show you the output of the pre-commit workflow without doing a commit.

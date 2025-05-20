# Python 

- Continuously checks Redis for render jobs.
- It takes the Python code stored in Redis, saves it to a file
- Then runs a Manim rendering command inside a Docker container to produce a video
- It updates the job status in Redis as it progresses.

## Instructions for Manim
```bash
docker compose up -d
```

```bash
docker exec -it my-manim-container bash
```

```bash
manim -qm main.py CreateCircle
```

## Here are some simple animation prompts you can use:

- 1.Bouncing Ball
"Animate a red ball bouncing up and down smoothly on the screen."

- 2 Growing Circle
"Show a blue circle that starts small and gradually grows bigger."

- 3 Rotating Square
"Animate a green square rotating clockwise in the center."

- 4 Moving Star
"Make a yellow star move from left to right across the screen."

- 5 Fading Text
"Display the word 'Hello' fading in and then fading out."


from manim import *

class RedBox(Scene):
    def construct(self):
        box = Square(color=RED, fill_opacity=1)
        self.play(Create(box))
        self.wait(1)
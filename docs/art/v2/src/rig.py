"""rig.py - tiny 2D skeleton helpers shared by the pose rigs.

Angles are in degrees, 0 = pointing DOWN (+y), +90 = pointing FORWARD (+x,
the character faces right), 180 = up, -90 = backward.  World y grows down;
the ground is y = 0 and the sprite anchor (foot point) is (0, 0).
"""
import math
from geom import *


def pt(p, a, L):
    r = math.radians(a)
    return (p[0] + L * math.sin(r), p[1] + L * math.cos(r))


def ang(a, b):
    """angle (our convention) of the vector a->b"""
    return math.degrees(math.atan2(b[0] - a[0], b[1] - a[1]))


def dist(a, b):
    return math.hypot(b[0] - a[0], b[1] - a[1])


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def ik2(A, T, L1, L2, bend=1):
    """2-bone IK: joint position between A and target T.  bend=+1 puts the
    joint on the forward (+x-ish) side of the A->T line, -1 backward."""
    d = min(dist(A, T), L1 + L2 - 1e-3)
    d = max(d, abs(L1 - L2) + 1e-3)
    a0 = ang(A, T)
    c = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)
    c = max(-1.0, min(1.0, c))
    off = math.degrees(math.acos(c))
    # +off rotates toward +x when the limb points down (forward bend)
    return pt(A, a0 + bend * off, L1)


def rotv(v, a):
    r = math.radians(a)
    c, s = math.cos(r), math.sin(r)
    return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)


class Frame:
    """local frame: origin o, axis angle a (local +y along a, local +x is the
    'forward' normal = axis rotated -90 deg in screen terms)."""

    def __init__(self, o, a):
        self.o = o
        r = math.radians(a)
        self.ax = (math.sin(r), math.cos(r))            # local +y
        self.fw = (math.cos(r), -math.sin(r))           # local +x
        self.a = a

    def __call__(self, p):
        x, y = p
        return (self.o[0] + x * self.fw[0] + y * self.ax[0], self.o[1] + x * self.fw[1] + y * self.ax[1])

    def pts(self, ps):
        return [self(p) for p in ps]

    def light(self, v):
        """a world-space light shift expressed for a mask drawn in world
        space - unchanged (helper kept for symmetry)"""
        return v


def ease(t):
    return .5 - .5 * math.cos(math.pi * t)


def cyc(t, phase=0.0):
    return (t + phase) % 1.0

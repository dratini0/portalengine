= Portal-based rendering engine demo

This is a WebGL/three.js implementation for a portal-enabled rendering engine.

== What are portals?

Portals are polygons seamlessly connecting two parts of space.
They have a polygon and a transformation matrix associated to them.
The polygon is the shape of the portal, a convex and coplanar set of
points. The transformation matrix defines the transformation which
any object passing through the portal is subjected to. It can be any
kind of a matrix: even a non-uniform scale!

These portals are similar to Unreal Engine's WarpZones, or
Source's Areaportals but are much more capable then those, as they
allow any arbitrary affine transform.

They are stationary and transition through them will be seamless,
allowing fo various forms of impossible spaces.

== Insipration

This thing was mainly inspired by a [video on YouTube by user
tonymyre311](https://www.youtube.com/watch?v=_xFbRecjKQA).

== Running things locally

If you want to run this program locally you will have to use some
tricks. See [this article for details](https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally).

== Acknowlegements

This program includes code from three.js. For copyright infomration,
see the file three.js/LICENSE.

== Copyright

This program is available under the terms of the GNU Gereal Public
License Version 2 or later. For details, see the file COPYRIGHT.

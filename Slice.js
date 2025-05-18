import { SegmentIntersectionPoint } from './Intersections'

// >0 on left side, <0 on right side, =0 on the line
function SideOfLine(px, py, ax, ay, bx, by) {
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}


function SliceQuad(quadPts, cutA, cutB) {
    const polyA = [], intersections = [], polyB = [];

    const ax = cutA[0],
        ay = cutA[1],
        bx = cutB[0],
        by = cutB[1];

    //  compute side for each vertex
    const sides = quadPts.map(p =>
        SideOfLine(p.x, p.y, ax, ay, bx, by)
    );

    // walk theedges
    for (let i = 0; i < quadPts.length; i++) {
        const curr = quadPts[i];
        const next = quadPts[(i + 1) % quadPts.length];
        const currSide = sides[i];
        const nextSide = sides[(i + 1) % sides.length];

        // add the current point to its side
        if (currSide >= 0) polyA.push(curr);
        if (currSide <= 0) polyB.push(curr);

        //  if it crosses, insert the intersection
        if (currSide * nextSide < 0) {
            const I = SegmentIntersectionPoint(
                ax, ay, bx, by,
                curr.x, curr.y, next.x, next.y
            );
            //console.log('  intersection? →', I);
            if (I) {
                polyA.push(I);
                polyB.push(I);
                intersections.push(I);
            }
        }
    }

    return { polyA, polyB, intersections };
}

export function ProcessSwipeSlice({
    quads,
    A,
    B,
    now,
    lastSliceTimeRef,
    SWIPE_INTERVAL = 250
}) {
    const newFlashes = []
    const newQuads = quads.flatMap(fruit => {
        const { polyA, polyB, intersections } = SliceQuad(fruit.pts, A, B)
        if (intersections.length >= 2) {
         
            // compute midpoint of the two intersection points
            const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = intersections
            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2

            // throttle so we only slice once per interval
            if (now - lastSliceTimeRef.current >= SWIPE_INTERVAL) {
                lastSliceTimeRef.current = now
                newFlashes.push({
                    id: Math.random().toString(),
                    x: midX,
                    y: midY
                })

                return [
                    {
                        ...fruit,
                        id: fruit.id + 'a',
                        pts: polyA,
                        vx: fruit.vx - 50,
                        vy: fruit.vy - 200,
                        isSliced: true
                    },
                    {
                        ...fruit,
                        id: fruit.id + 'b',
                        pts: polyB,
                        vx: fruit.vx + 50,
                        vy: fruit.vy - 200,
                        isSliced: true
                    }
                ]
            }
        }
        // no slice: leave it alone
        return [fruit]
    })

    return { newQuads, newFlashes }
}
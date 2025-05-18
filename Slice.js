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
export function centroid(pts) {
  let A = 0;      // accumulated signed area
  let Cx = 0;     // accumulated moments for x
  let Cy = 0;     // accumulated moments for y

  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const { x: x0, y: y0 } = pts[i];
    const { x: x1, y: y1 } = pts[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    A  += cross;
    Cx += (x0 + x1) * cross;
    Cy += (y0 + y1) * cross;
  }

  A *= 0.5;
  // For a non-degenerate polygon A ≠ 0
  return {
    x: Cx / (6 * A),
    y: Cy / (6 * A)
  };
}
export function ProcessSwipeSlice({
    quads,
    A,
    B,
    now
}) {
   
    const newFlashes = []
    const newQuads = quads.flatMap(fruit => {
        console.log(fruit.hitPts);
        const { polyA, polyB, intersections } = SliceQuad(fruit.pts, A, B)
        if (intersections.length >= 2) {
         
            // compute midpoint of the two intersection points
            const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = intersections
            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2

            console.log(fruit.lastSliceTimeRef);
            // throttle so we only slice once per interval
            if (now - fruit.lastSliceTimeRef >= fruit.SWIPE_INTERVAL) {
                const pivotA = centroid(polyA),
                pivotB = centroid(polyB);
                fruit.lastSliceTimeRef= now;
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
                        pivot: pivotA,
                        aVel: fruit.aVel + 200, 
                        isSliced: true,
                         lastSliceTimeRef: fruit.lastSliceTimeRef,
                         SWIPE_INTERVAL: fruit.SWIPE_INTERVAL,
                        },
                        {
                            ...fruit,
                            id: fruit.id + 'b',
                            lastSliceTimeRef: fruit.lastSliceTimeRef,
                        pts: polyB,
                        vx: fruit.vx + 50,
                        vy: fruit.vy - 200,
                        pivot: pivotB,
                        aVel: fruit.aVel - 200, 
                        isSliced: true,
                        SWIPE_INTERVAL: fruit.SWIPE_INTERVAL,
                    }
                ]
            }
        }
        // no slice: leave it alone
        return [fruit]
    })

    return { newQuads, newFlashes }
}
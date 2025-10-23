const nodes = [
  {id:0, name:'A', x:120, y:80}, {id:1, name:'B', x:320, y:60},
  {id:2, name:'C', x:520, y:80}, {id:3, name:'D', x:720, y:60},
  {id:4, name:'E', x:920, y:80}, {id:5, name:'F', x:110, y:260},
  {id:6, name:'G', x:300, y:220}, {id:7, name:'H', x:500, y:240},
  {id:8, name:'I', x:700, y:240}, {id:9, name:'J', x:920, y:260},
  {id:10, name:'K', x:200, y:420}, {id:11, name:'L', x:420, y:380},
  {id:12, name:'M', x:600, y:420}, {id:13, name:'N', x:820, y:380},
  {id:14, name:'O', x:60, y:600}, {id:15, name:'P', x:260, y:620},
  {id:16, name:'Q', x:440, y:620}, {id:17, name:'R', x:640, y:620},
  {id:18, name:'S', x:860, y:600}, {id:19, name:'T', x:1020, y:520},
  {id:20, name:'U', x:320, y:520}, {id:21, name:'V', x:720, y:520}
];

const edges = [
  {u:0, v:1, weight:8},   {u:1, v:2, weight:7},  {u:2, v:3, weight:6},  {u:3, v:4, weight:9},
  {u:0, v:5, weight:12},  {u:1, v:6, weight:10}, {u:2, v:7, weight:5},  {u:3, v:8, weight:11},
  {u:4, v:9, weight:4},   {u:5, v:6, weight:3},  {u:6, v:7, weight:6},  {u:7, v:8, weight:4},
  {u:8, v:9, weight:7},   {u:5, v:10, weight:9}, {u:6, v:11, weight:7}, {u:7, v:12, weight:8},
  {u:8, v:13, weight:5},  {u:9, v:19, weight:12},{u:10, v:11, weight:4},{u:11, v:12, weight:5},
  {u:12, v:13, weight:6},{u:10, v:14, weight:7}, {u:14, v:15, weight:5},{u:15, v:16, weight:6},
  {u:16, v:20, weight:8},{u:20, v:10, weight:9}, {u:16, v:17, weight:7},{u:17, v:21, weight:6},
  {u:21, v:13, weight:9}, {u:13, v:18, weight:4}, {u:18, v:19, weight:6},{u:15, v:6, weight:10},
  {u:11, v:20, weight:11}, {u:12, v:17, weight:10}, {u:1, v:6, weight:2}, {u:2, v:7, weight:2},
  {u:6, v:11, weight:3}, {u:7, v:12, weight:3}
];

document.getElementById('nodeCount').innerText = nodes.length;
document.getElementById('edgeCount').innerText = edges.length;

const svg = document.getElementById('canvas');

function clearSVG(){ while(svg.firstChild) svg.removeChild(svg.firstChild); }

function drawGraph(){
  clearSVG();
  edges.forEach((e, idx)=>{
    const a = nodes[e.u], b = nodes[e.v];
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', a.x + 40);
    line.setAttribute('y1', a.y + 40);
    line.setAttribute('x2', b.x + 40);
    line.setAttribute('y2', b.y + 40);
    line.setAttribute('stroke', '#999');
    line.setAttribute('stroke-width', 3);
    line.setAttribute('data-edge', idx);
    line.setAttribute('class', 'edge');
    line.setAttribute('stroke-linecap','round');
    svg.appendChild(line);

    const mx = (a.x + b.x)/2 + 40;
    const my = (a.y + b.y)/2 + 40;
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', mx);
    t.setAttribute('y', my - 8);
    t.setAttribute('class', 'edge-label');
    t.textContent = e.weight;
    svg.appendChild(t);
  });

  nodes.forEach(n=>{
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('transform', `translate(${n.x + 40},${n.y + 40})`);
    g.setAttribute('class','node-group');

    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('r', 20);
    circle.setAttribute('fill', '#0b66c3');
    circle.setAttribute('stroke', '#083f7a');
    circle.setAttribute('stroke-width', 2);
    g.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('class','node-label');
    label.textContent = n.name;
    g.appendChild(label);

    svg.appendChild(g);
  });
}

drawGraph();

class UnionFind {
    constructor(n){
        this.parent = Array.from({length:n}, (_,i)=>i);
    }
    find(u){
        if(this.parent[u]!==u) this.parent[u] = this.find(this.parent[u]);
        return this.parent[u];
    }
    union(u,v){
        const pu = this.find(u), pv = this.find(v);
        if(pu===pv) return false;
        this.parent[pu]=pv;
        return true;
    }
}

function highlightEdges(edgeIndices, color){
    edgeIndices.forEach(idx=>{
        const line = svg.querySelector(`line[data-edge="${idx}"]`);
        if(line) line.setAttribute('stroke', color);
    });
}

function resetEdgeHighlights(){
    edges.forEach((_, idx)=>{
        const line = svg.querySelector(`line[data-edge="${idx}"]`);
        if(line) line.setAttribute('stroke', '#999');
    });
}

document.getElementById('resetBtn').onclick = ()=>{
    drawGraph();
    document.getElementById('mstCost').innerText='—';
    document.getElementById('routeInfo').innerText='—';
    document.getElementById('slotInfo').innerText='—';
}

// --- Prim's Algorithm ---
document.getElementById('primBtn').onclick = ()=>{
    resetEdgeHighlights();

    const n = nodes.length;
    const visited = Array(n).fill(false);
    const minEdge = Array(n).fill(Infinity);
    const parent = Array(n).fill(-1);

    minEdge[0]=0;
    let mstCost = 0;

    for(let i=0;i<n;i++){
        let u=-1;
        for(let v=0;v<n;v++)
            if(!visited[v] && (u===-1||minEdge[v]<minEdge[u])) u=v;
        visited[u]=true;
        mstCost += minEdge[u];
        edges.forEach((e,idx)=>{
            const v = (e.u===u)? e.v : (e.v===u)? e.u : -1;
            if(v!==-1 && !visited[v] && e.weight<minEdge[v]){
                minEdge[v]=e.weight;
                parent[v]=u;
            }
        });
    }

    const mstEdges = [];
    for(let v=1;v<n;v++){
        const u=parent[v];
        edges.forEach((e,idx)=>{
            if((e.u===u && e.v===v)||(e.u===v && e.v===u)) mstEdges.push(idx);
        });
    }
    highlightEdges(mstEdges,'limegreen');
    document.getElementById('mstCost').innerText = mstCost;
}

// --- Kruskal's Algorithm ---
document.getElementById('kruskalBtn').onclick = ()=>{
    resetEdgeHighlights();

    const uf = new UnionFind(nodes.length);
    const sortedEdges = edges.map((e,idx)=>({...e, idx})).sort((a,b)=>a.weight-b.weight);
    const mstEdges = [];
    let mstCost = 0;

    sortedEdges.forEach(e=>{
        if(uf.union(e.u,e.v)){
            mstEdges.push(e.idx);
            mstCost += e.weight;
        }
    });

    highlightEdges(mstEdges,'limegreen');
    document.getElementById('mstCost').innerText = mstCost;
}

// --- Fleury's Algorithm (Eulerian Path) ---
document.getElementById('fleuryBtn').onclick = ()=>{
    resetEdgeHighlights();

    const n = nodes.length;
    const adj = Array.from({length:n},()=>[]);
    edges.forEach((e,idx)=>{
        adj[e.u].push({v:e.v, idx});
        adj[e.v].push({v:e.u, idx});
    });

    let start=0;
    for(let i=0;i<n;i++) if(adj[i].length%2===1){start=i; break;}

    const route=[], usedEdge=new Set();

    function dfs(u){
        while(adj[u].length){
            const e = adj[u].pop();
            if(usedEdge.has(e.idx)) continue;
            usedEdge.add(e.idx);
            adj[e.v] = adj[e.v].filter(x=>x.v!==u || x.idx!==e.idx);
            dfs(e.v);
            route.push(e.idx);
        }
    }
    dfs(start);
    route.reverse();
    highlightEdges(route,'#ff6b6b');
    document.getElementById('routeInfo').innerText = route.map(idx=>`${nodes[edges[idx].u].name}-${nodes[edges[idx].v].name}`).join(', ');
}

// --- Greedy Coloring ---
document.getElementById('colorBtn').onclick = ()=>{
    const n = nodes.length;
    const colors = Array(n).fill(-1);
    const adj = Array.from({length:n},()=>[]);
    edges.forEach(e=>{
        adj[e.u].push(e.v);
        adj[e.v].push(e.u);
    });

    for(let u=0; u<n; u++){
        const forbidden = new Set(adj[u].map(v=>colors[v]).filter(c=>c!==-1));
        let c=0;
        while(forbidden.has(c)) c++;
        colors[u]=c;
    }

    const colorPalette=['#0b66c3','#f94144','#f3722c','#f9c74f','#90be6d','#43aa8b','#577590','#7209b7','#ff6d00','#4cc9f0'];
    document.querySelectorAll('g.node-group').forEach((g,i)=>{
        const circle = g.querySelector('circle');
        circle.setAttribute('fill', colorPalette[colors[i]%colorPalette.length]);
    });
    const maxColor = Math.max(...colors)+1;
    document.getElementById('slotInfo').innerText = maxColor;
}

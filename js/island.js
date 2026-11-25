// A bounded pedestrian district used only by the product selector.
window.createProductIsland = function (T, products, modelFor) {
  const scene = new T.Scene();
  scene.background = new T.Color(0xeae6da);
  const camera = new T.OrthographicCamera(-16, 16, 12, -12, .1, 150);
  scene.add(new T.HemisphereLight(0xfffcf1, 0xb9ad94, 2));
  const sun = new T.DirectionalLight(0xfff3d6, 2.3);
  sun.position.set(-12, 24, 12); scene.add(sun);
  const cube = new T.BoxGeometry(1, 1, 1), materials = new Map();
  function mesh(shape, color, x, y, z) {
    if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({color, roughness:.88}));
    const part = new T.Mesh(shape, materials.get(color));
    part.position.set(x,y,z); scene.add(part); return part;
  }
  function box(x,y,z,w,h,d,color) {
    const part=mesh(cube,color,x,y,z); part.scale.set(w,h,d); return part;
  }
  function slab(w,d,h,y,r,color) {
    const path=new T.Shape(), x=w/2,z=d/2;
    path.moveTo(-x+r,-z); path.lineTo(x-r,-z); path.quadraticCurveTo(x,-z,x,-z+r);
    path.lineTo(x,z-r);path.quadraticCurveTo(x,z,x-r,z);path.lineTo(-x+r,z);
    path.quadraticCurveTo(-x,z,-x,z-r);path.lineTo(-x,-z+r);path.quadraticCurveTo(-x,-z,-x+r,-z);
    const part=mesh(new T.ExtrudeGeometry(path,{depth:h,bevelEnabled:false}),color,0,y,0);
    part.rotation.x=-Math.PI/2;
  }
  slab(23.4,15.4,1.05,-1.18,1.6,0x9a8d77);
  slab(23.5,15.5,.22,-.13,1.6,0xc4b59c);
  slab(23.3,15.3,.10,.09,1.55,0xe3d7bf);
  const stops=[[-8,2.5],[-3,-2.5],[3,2.5],[8,-2.5]];
  const bends=[stops[0],[-5.5,2.5],[-5.5,-2.5],stops[1],[.1,-2.5],[.1,2.5],stops[2],[5.7,2.5],[5.7,-2.5],stops[3]];
  function segment(a,b,width,height,color) {
    const dx=b[0]-a[0], dz=b[1]-a[1];
    const piece=box((a[0]+b[0])/2,height,(a[1]+b[1])/2,Math.hypot(dx,dz)+width,.045,width,color);
    piece.rotation.y=-Math.atan2(dz,dx);
  }
  for(let i=1;i<bends.length;i++) segment(bends[i-1],bends[i],2.15,.22,0xb6b5aa);
  for(let i=1;i<bends.length;i++) segment(bends[i-1],bends[i],.16,.265,0xfad246);
  // Each elevation is baked from the lower floors of the corresponding street landmark.
  const storefronts = [];
  const facades = [];
  let revision = 0;
  const roofMat = new T.MeshStandardMaterial({color:0xb6afa1,roughness:.87});
  const blankWall = new T.MeshStandardMaterial({color:0xc7c0b2,roughness:.88});
  const elevationMaterials = window.islandElevations.map(encoded => {
    const sides = [0,1,2,3].map(()=>blankWall.clone());
    const img = new Image();
    img.onload = () => {
      sides.forEach((mat,i)=>{
        const tile = document.createElement("canvas");
        tile.width = img.width / 4; tile.height = img.height;
        const ctx = tile.getContext("2d");
        ctx.drawImage(img,i*tile.width,0,tile.width,tile.height,0,0,tile.width,tile.height);
        const tex = new T.CanvasTexture(tile);
        tex.colorSpace = T.SRGBColorSpace;
        mat.color.setHex(0xffffff); mat.map=tex; mat.needsUpdate=true;
        mat.userData.tile=ctx.getImageData(0,0,tile.width,tile.height);
      });
      revision++;
    };
    img.src = "data:image/webp;base64,"+encoded;
    return [sides[0],sides[1],roofMat,blankWall,sides[2],sides[3]];
  });
  function shop(x,z,w,d,h,type,front) {
    const group = new T.Group();
    group.position.set(x,.2,z); group.rotation.y=front>0?0:Math.PI; scene.add(group);
    const proxy = new T.Group(); group.add(proxy);
    const shell=new T.Mesh(cube,elevationMaterials[type]); shell.scale.set(w,h,d);
    shell.position.y=h/2;proxy.add(shell);
    function roofPart(dx,y,dz,width,height,depth,color) {
      proxy.add(box(dx,y,dz,width,height,depth,color));
    }
    roofPart(0,h+.035,0,w+.06,.07,d+.06,0xc9c4b7);
    roofPart(0,h+.085,0,w-.12,.035,d-.12,0x968f81);
    roofPart(.18*w,h+.17,-.2*d,w*.20,.17,d*.25,0xb6afa1);
    storefronts.push({group,proxy,w,d,h,type});
  }
  // Continuous blocks with narrow rear lanes and taller floors behind the shopping street.
  const windows = new Map();
  function upperMaterial(stone) {
    if(windows.has(stone))return windows.get(stone);
    const tile=document.createElement("canvas");tile.width=192;tile.height=96;
    const g=tile.getContext("2d");g.fillStyle=stone;g.fillRect(0,0,192,96);
    for(let col=0;col<4;col++){
      const x=col*48+4;g.fillStyle="#918e83";g.fillRect(x,9,40,66);
      const glass=g.createLinearGradient(0,12,0,72);
      glass.addColorStop(0,"#829398");glass.addColorStop(.55,"#626f73");glass.addColorStop(1,"#424d50");
      g.fillStyle=glass;g.fillRect(x+2,11,36,59);
      g.fillStyle="#a9ada7";g.fillRect(x+2,29,36,2);g.fillRect(x+18,11,2,59);
    }
    g.fillStyle="#a39c8d";g.fillRect(0,88,192,4);
    const tex=new T.CanvasTexture(tile);tex.colorSpace=T.SRGBColorSpace;
    const mat=new T.MeshStandardMaterial({map:tex,roughness:.73});mat.userData.tile=g.getImageData(0,0,192,96);
    windows.set(stone,mat);return mat;
  }
  const stone=["#d2cabe","#b6afa2","#e3dfd3","#c6b59b","#b2b6b3"];
  function building(x,z,w,d,levels,type,front,i){
    const base=1.20+(i%3)*.12;
    shop(x,z,w,d,base,type,front);
    const mat=upperMaterial(stone[i%stone.length]);
    const walls=[mat,mat,roofMat,blankWall,mat,mat],floor=.68;
    for(let k=0;k<levels;k++){
      const part=new T.Mesh(cube,walls);part.scale.set(w-.06,floor,d-.06);
      part.position.set(x,.2+base+(k+.5)*floor,z);scene.add(part);
    }
    if(levels){
      const roof=.2+base+levels*floor;
      box(x,roof+.045,z,w+.04,.09,d+.04,0xc6c0b3);
      box(x-w*.15,roof+.17,z+d*.11,w*.29,.21,d*.31,0xb0a99a);
    }
  }
  function row(z,start,widths,depths,levels,front,offset){
    let edge=start;
    widths.forEach((w,j)=>{
      const i=j+offset,d=depths[j%depths.length];
      building(edge+w/2,z,w,d,levels[j],i%4,front,i);
      edge+=w+(j===3?.46:.12);
    });
  }
  row(-6.38,-10.8,[2.3,1.8,3.2,2.2,1.8,2.65,2.1,2.9],[1.85,1.7],[3,5,4,2,6,3,5,3],1,0);
  row(-4.30,-10.85,[1.7,2.7,2.05,3.25,1.65,1.8,2.7,3.35],[1.55,1.70],[1,2,1,3,1,2,2,1],1,3);
  row(5.65,-10.8,[2.05,2.9,1.55,2.6,3.2,1.65,2.3,2.65],[2.5,2.15],[1,1,2,0,1,2,0,1],-1,2);
  building(-8.8,-.50,3.1,2.0,2,1,1,3);
  building(-3.85,.30,1.15,2.0,1,2,1,4);
  building(-2.25,.30,1.78,2.0,0,0,1,7);
  building(2.0,-.45,1.4,1.75,2,3,1,8);
  building(3.65,-.45,1.65,1.75,1,2,1,9);
  building(8.8,.55,3.30,1.9,2,1,1,6);
  function installStorefronts(){
    for(let i=0;i<4;i++){
      if(facades[i])continue;
      const src=modelFor("0"+(i+1)+"_bld");
      if(!src)continue;
      const cap=[8,9.9,9.1,10.6][i];
      const root=new T.Group(), bounds=new T.Box3();
      src.updateMatrixWorld(true);
      src.traverse(node=>{
        if(!node.isMesh)return;
        const geo=node.geometry.clone().applyMatrix4(node.matrixWorld);
        geo.computeBoundingBox();
        const b=geo.boundingBox, roof=/roof/i.test(node.name) && !/brand|sign/i.test(node.name);
        if(roof)geo.translate(0,cap-[12,16,17,40][i],0);
        else if(b.min.y>=cap){geo.dispose();return;}
        else if(b.max.y>cap){
          const pos=geo.attributes.position;
          for(let j=0;j<pos.count;j++)pos.setY(j,Math.min(cap,pos.getY(j)));
        }
        geo.computeBoundingBox();geo.computeBoundingSphere();
        bounds.union(geo.boundingBox);
        root.add(new T.Mesh(geo,node.material));
      });
      const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
      root.position.set(-center.x,-bounds.min.y,-center.z);
      const shops=storefronts.filter(s=>s.type===i);
      const detailed=[shops.find(s=>s.group.position.z===-4.30),shops.find(s=>Math.abs(s.group.position.z)<1.1)];
      detailed.filter(Boolean).forEach(s=>{
        const scaled=new T.Group();scaled.scale.set(s.w/size.x,s.h/cap,s.d/size.z);
        scaled.add(root.clone(true));s.group.add(scaled);s.proxy.visible=false;
      });
      facades[i]=root;
    }
  }
  const crown=new T.IcosahedronGeometry(1,1), trunk=new T.CylinderGeometry(.08,.11,.8,8);
  [[-10.5,2.6],[-10.5,-2.45],[-.95,1.48],[8.2,3.4],[10.7,-1.8]].forEach(([x,z],i)=>{
    box(x,.27,z,.94,.16,.94,0xc4c6a1);
    mesh(trunk,0x84715c,x,.72,z);
    mesh(crown,i%2?0x839572:0x6e876b,x,1.35,z).scale.set(.6,.8,.6);
  });
  const pedestal=new T.CylinderGeometry(.91,1,.12,32);
  // Miniatures keep each location identifiable while the full meshes load.
  const placeholders = stops.map(([x,z],i)=>{
    const group=new T.Group();
    function part(dx,y,dz,w,h,d,c) {const item=box(dx,y,dz,w,h,d,c);group.add(item);}
    if(i===0){part(0,.43,0,.3,.85,.32,0x575954);part(0,1.16,0,.95,.75,.24,0x3e5957);}
    if(i===1){part(0,1,0,.32,2,.32,0x464c46);part(0,.94,.18,.6,.7,.08,0xe4d6b7);part(0,.59,.40,.6,.08,.46,0xe4d6b7);}
    if(i===2){part(0,.4,0,.15,.8,.18,0x5b6258);part(0,.82,0,1.45,.12,.88,0xc0a480);}
    if(i===3){[-.37,.37].forEach(dx=>{part(dx,.47,0,.63,.34,.12,0x465c59);part(dx,.53,-.27,.07,.08,.55,0x444a47);});part(0,.52,0,.19,.09,.1,0x444a47);}
    group.position.set(x,.42,z);scene.add(group);return group;
  });
  const installed=[];
  const pickRay=new T.Raycaster();
  function pick(x,y,w,h) {
    pickRay.setFromCamera(new T.Vector2(2*x/w-1,1-2*y/h),camera);
    for(const hit of pickRay.intersectObjects(installed.map((v,i)=>v||placeholders[i]).concat(placeholders.filter(p=>p.visible)),true)){
      for(let p=hit.object;p;p=p.parent){const i=stops.findIndex((_,j)=>p===installed[j]||p===placeholders[j]);if(i>=0)return i;}
    }
    return -1;
  }
  stops.forEach(([x,z])=>mesh(pedestal,0xcfae5b,x,.34,z));
  function installModels() {
    products.forEach((p,i)=>{
      if(installed[i])return;
      const src=modelFor(p.model);
      if(!src)return;
      const root=src.clone(true),wrap=new T.Group();wrap.add(root);
      const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
      root.position.sub(new T.Vector3(center.x,bounds.min.y,center.z));
      wrap.scale.setScalar(2.0/Math.max(size.x,size.y,size.z,.001));
      wrap.position.set(stops[i][0],.42,stops[i][1]);wrap.rotation.y=p.model==="staygap_rail_v7" ? Math.PI-.45 : -.45;scene.add(wrap);installed[i]=wrap;placeholders[i].visible=false;
    });
  }
  const bead=mesh(new T.SphereGeometry(.19,12,8),0xeeac17,0,.43,0);bead.visible=false;
  const lengths=bends.slice(1).map((p,i)=>Math.hypot(p[0]-bends[i][0],p[1]-bends[i][1]));
  function render(renderer,w,h,yaw,progress){
    installStorefronts();
    installModels();
    const ratio=w/h, a=.38+yaw;
    const c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));
    const half=Math.max((11.9*c+8*s)/ratio,(11.9*s+8*c)*.65+1.65)*1.10;
    camera.left=-half*ratio;camera.right=half*ratio;camera.top=half;camera.bottom=-half;

    camera.position.set(38*Math.sin(a),32,38*Math.cos(a));camera.lookAt(0,1.1,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    bead.visible=progress>=0;
    if(bead.visible){let dist=progress*lengths.reduce((a,b)=>a+b,0),i=0;while(i<lengths.length-1&&dist>lengths[i])dist-=lengths[i++];const t=dist/lengths[i];bead.position.x=bends[i][0]*(1-t)+bends[i+1][0]*t;bead.position.z=bends[i][1]*(1-t)+bends[i+1][1]*t;}
    renderer.render(scene,camera);
    return stops.map(([x,z])=>{const p=new T.Vector3(x,1.3,z).project(camera);return [(p.x+1)*w/2,(1-p.y)*h/2];});
  }
  return {render,pick,get revision(){return revision;}};
};

// Project the same miniature on devices without WebGL.
window.islandCanvasRenderer = function (T, canvas) {
  const ctx=canvas.getContext('2d');
  return {render(scene,camera) {
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
    scene.updateMatrixWorld(true);
    const frame=ctx.createImageData(w,h),pixels=new Uint32Array(frame.data.buffer);
    pixels.fill(0xffdae6ea);
    const depth=new Float32Array(w*h);depth.fill(Infinity);
    const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();
    scene.traverseVisible(mesh=>{
      if(!mesh.isMesh)return;
      const g=mesh.geometry,coords=g.attributes.position,idx=g.index,count=idx?idx.count:coords.count;
      for(let n=0;n<count;n+=3){
        [a,b,c].forEach((p,j)=>{
          p.fromBufferAttribute(coords,idx?idx.getX(n+j):n+j).applyMatrix4(mesh.matrixWorld).project(camera);
          p.x=(p.x+1)*w/2;p.y=(1-p.y)*h/2;
        });
        const area=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
        if(area>=-.001)continue;
        normal.fromBufferAttribute(g.attributes.normal,idx?idx.getX(n):n).transformDirection(mesh.matrixWorld);
        const material=Array.isArray(mesh.material) ? mesh.material[g.groups.find(group=>n>=group.start && n<group.start+group.count).materialIndex] : mesh.material;
        const tile=material.userData.tile,uv=g.attributes.uv;
        const rgb=material.color.clone().multiplyScalar(.8+.19*normal.y-.10*normal.x).getHex();
        const color=0xff000000|(rgb&255)<<16|(rgb&65280)|(rgb>>16);
        const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x)));
        const y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
        for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
          const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/area;
          const v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/area;
          const t=1-u-v;
          if(u<0||v<0||t<0)continue;
          const d=u*a.z+v*b.z+t*c.z,k=y*w+x;
          if(d>=depth[k])continue;
          depth[k]=d;pixels[k]=color;
          if(tile){
            const ia=idx.getX(n),ib=idx.getX(n+1),ic=idx.getX(n+2);
            const tx=Math.min(tile.width-1,Math.max(0,Math.floor((u*uv.getX(ia)+v*uv.getX(ib)+t*uv.getX(ic))*tile.width)));
            const ty=Math.min(tile.height-1,Math.max(0,Math.floor((1-u*uv.getY(ia)-v*uv.getY(ib)-t*uv.getY(ic))*tile.height)));
            const off=4*(ty*tile.width+tx),tex=tile.data,light=.87+.1*normal.y-.09*normal.x;
            pixels[k]=0xff000000|Math.round(tex[off+2]*light)<<16|Math.round(tex[off+1]*light)<<8|Math.round(tex[off]*light);
          }
        }
      }
    });
    ctx.putImageData(frame,0,0);
  }};
};

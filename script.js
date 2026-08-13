/* === 1. المحاكاة البصرية للمجال في الواجهة الرئيسية === */
const container1 = document.getElementById('canvas-container');
const scene1 = new THREE.Scene();
scene1.background = new THREE.Color(0x111114);
const camera1 = new THREE.PerspectiveCamera(55, container1.clientWidth / container1.clientHeight, 0.1, 1000);
camera1.position.set(0, 7, 11);
const renderer1 = new THREE.WebGLRenderer({ antialias: true });
renderer1.setSize(container1.clientWidth, container1.clientHeight);
container1.appendChild(renderer1.domElement);
const controls1 = new THREE.OrbitControls(camera1, renderer1.domElement);

const count = 60, numParticles = count * count;
const geometry1 = new THREE.BufferGeometry();
const positions1 = new Float32Array(numParticles * 3);
const colors1 = new Float32Array(numParticles * 3);
let idx = 0;
for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
        positions1[idx * 3] = (i - count / 2) * 0.25;
        positions1[idx * 3 + 1] = 0;
        positions1[idx * 3 + 2] = (j - count / 2) * 0.25;
        idx++;
    }
}
geometry1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
geometry1.setAttribute('color', new THREE.BufferAttribute(colors1, 3));
const particles1 = new THREE.Points(geometry1, new THREE.PointsMaterial({ size: 0.1, vertexColors: true }));
scene1.add(particles1);

let clock = new THREE.Clock();
function animate1() {
    requestAnimationFrame(animate1);
    const time = clock.getElapsedTime() * 2;
    const pos = particles1.geometry.attributes.position;
    const col = particles1.geometry.attributes.color;
    for (let i = 0; i < numParticles; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const r = Math.sqrt(x*x + z*z) + 0.1;
        const wave = Math.sin(r * 2.0 - time) * 0.25;
        pos.setY(i, wave);
        col.setX(i, 0.72); col.setY(i, 0.59 + wave * 0.2); col.setZ(i, 0.38);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    controls1.update();
    renderer1.render(scene1, camera1);
}
animate1();


/* === 2. تجربة لورنتز (Lorentz Force) === */
let lScene, lCamera, lRenderer, lControls;
let pMesh, trailLine, trailPositions;
let pos, vel, charge = 1, mass = 1;
const maxTrail = 500;
let trailIdx = 0, isLInit = false;

function openLorentzLab() {
    document.getElementById('lorentzModal').style.display = 'block';
    if(!isLInit) initLorentzLab();
}

function closeLorentzLab() {
    document.getElementById('lorentzModal').style.display = 'none';
}

function initLorentzLab() {
    isLInit = true;
    const lContainer = document.getElementById('lorentz-canvas');
    lScene = new THREE.Scene(); lScene.background = new THREE.Color(0x0e0e11);
    lCamera = new THREE.PerspectiveCamera(50, lContainer.clientWidth / lContainer.clientHeight, 0.1, 1000);
    lCamera.position.set(0, 12, 20);
    lRenderer = new THREE.WebGLRenderer({ antialias: true });
    lRenderer.setSize(lContainer.clientWidth, lContainer.clientHeight);
    lContainer.appendChild(lRenderer.domElement);
    lControls = new THREE.OrbitControls(lCamera, lRenderer.domElement);

    const grid = new THREE.GridHelper(30, 30, 0xb89762, 0x222228);
    lScene.add(grid);

    pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshBasicMaterial({ color: 0xb89762 }));
    lScene.add(pMesh);

    const tGeo = new THREE.BufferGeometry();
    trailPositions = new Float32Array(maxTrail * 3);
    tGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailLine = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ color: 0xb89762, opacity: 0.8, transparent: true }));
    lScene.add(trailLine);

    applyPreset();
    animateLorentz();
}

function applyPreset() {
    const type = document.getElementById('pPreset').value;
    if(type === 'proton') { charge = 1; mass = 1; pMesh.material.color.setHex(0xb89762); }
    else if(type === 'electron') { charge = -1; mass = 0.05; pMesh.material.color.setHex(0x4a90e2); }
    else if(type === 'alpha') { charge = 2; mass = 4; pMesh.material.color.setHex(0xe25c4a); }
    document.getElementById('valQ').innerText = (charge > 0 ? '+' : '') + charge + 'e';
    resetLorentz();
}

function resetLorentz() {
    if(!isLInit) return;
    pos = new THREE.Vector3(-8, 0, 0);
    const v0 = parseFloat(document.getElementById('vInit').value) * 0.04;
    vel = new THREE.Vector3(v0, 0, 0);
    pMesh.position.copy(pos);
    trailIdx = 0;
    for(let i=0; i<maxTrail*3; i++) trailPositions[i] = 0;
    trailLine.geometry.attributes.position.needsUpdate = true;
    updatePhysics();
}

function updatePhysics() {
    if(!isLInit) return;
    const B_z = parseFloat(document.getElementById('bMag').value) * 0.1;
    const vVal = vel ? vel.length() : 1;
    if (Math.abs(B_z) > 0.01) {
        const r = (mass * vVal) / (Math.abs(charge) * Math.abs(B_z));
        document.getElementById('valR').innerText = r.toFixed(2) + ' m';
    } else {
        document.getElementById('valR').innerText = '∞';
    }
}

function animateLorentz() {
    requestAnimationFrame(animateLorentz);
    if(pos && vel) {
        const B_z = parseFloat(document.getElementById('bMag').value) * 0.1;
        const E_y = parseFloat(document.getElementById('eField').value) * 0.002;
        const B = new THREE.Vector3(0, 0, B_z), E = new THREE.Vector3(0, E_y, 0);
        const F = E.add(new THREE.Vector3().crossVectors(vel, B)).multiplyScalar(charge);

        vel.add(F.divideScalar(mass).multiplyScalar(0.016));
        pos.add(vel);
        pMesh.position.copy(pos);
        document.getElementById('valF').innerText = F.length().toFixed(3) + ' N';

        if(trailIdx < maxTrail) {
            trailPositions[trailIdx * 3] = pos.x; trailPositions[trailIdx * 3 + 1] = pos.y; trailPositions[trailIdx * 3 + 2] = pos.z;
            trailIdx++;
        }
        trailLine.geometry.attributes.position.needsUpdate = true;
        if(pos.length() > 20) resetLorentz();
    }
    lControls.update();
    lRenderer.render(lScene, lCamera);
}


/* === 3. تجربة الذرة الكوانتية وتكميم الطاقة (Bohr Quantum Atom) === */
let qScene, qCamera, qRenderer, qControls;
let nucleusMesh, electronMesh, currentOrbitLine;
let currentN = 1, electronAngle = 0;
let isQInit = false, photonMesh = null;

function openQuantumLab() {
    document.getElementById('quantumModal').style.display = 'block';
    if(!isQInit) initQuantumLab();
}

function closeQuantumLab() {
    document.getElementById('quantumModal').style.display = 'none';
}

function initQuantumLab() {
    isQInit = true;
    const qContainer = document.getElementById('quantum-canvas');

    qScene = new THREE.Scene(); qScene.background = new THREE.Color(0x0e0e11);
    qCamera = new THREE.PerspectiveCamera(50, qContainer.clientWidth / qContainer.clientHeight, 0.1, 1000);
    qCamera.position.set(0, 10, 15);
    qRenderer = new THREE.WebGLRenderer({ antialias: true });
    qRenderer.setSize(qContainer.clientWidth, qContainer.clientHeight);
    qContainer.appendChild(qRenderer.domElement);
    qControls = new THREE.OrbitControls(qCamera, qRenderer.domElement);

    // النواة
    nucleusMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), new THREE.MeshBasicMaterial({ color: 0xe25c4a }));
    qScene.add(nucleusMesh);

    // رسم مستويات الطاقة الخمس المكممة (n = 1..5)
    for(let n=1; n<=5; n++) {
        const radius = n * n * 1.2;
        const ringGeo = new THREE.RingGeometry(radius - 0.03, radius + 0.03, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x33333d, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        qScene.add(ring);
    }

    // الإلكترون
    electronMesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), new THREE.MeshBasicMaterial({ color: 0x4a90e2 }));
    qScene.add(electronMesh);

    updateQuantumData();
    animateQuantum();
}

function changeOrbit() {
    if(!isQInit) return;
    const oldN = currentN;
    currentN = parseInt(document.getElementById('targetLevel').value);

    // حساب طول موجة الانبعاث/الامتصاص Delta E = h*c / lambda
    const E_old = -13.6 / (oldN * oldN);
    const E_new = -13.6 / (currentN * currentN);
    const dE = Math.abs(E_new - E_old);

    if (dE > 0) {
        const lambda = (1240 / dE).toFixed(1); // nm
        document.getElementById('valWave').innerText = lambda + ' nm';
        document.getElementById('valSeries').innerText = currentN === 1 ? 'سلسلة ليمان (UV)' : (currentN === 2 ? 'سلسلة بالمر (مرئي)' : 'سلسلة باشن (IR)');
    } else {
        document.getElementById('valWave').innerText = '-- nm';
        document.getElementById('valSeries').innerText = 'استقرار';
    }

    updateQuantumData();
}

function updateQuantumData() {
    const En = (-13.6 / (currentN * currentN)).toFixed(2);
    const rn = (0.53 * currentN * currentN).toFixed(2);
    document.getElementById('valEnergy').innerText = En + ' eV';
    document.getElementById('valRadius').innerText = rn + ' Å';
}

function animateQuantum() {
    requestAnimationFrame(animateQuantum);

    if(electronMesh) {
        const r = currentN * currentN * 1.2;
        electronAngle += 0.02 / currentN; // السرعة تقل في المستويات الخارجي
        electronMesh.position.x = r * Math.cos(electronAngle);
        electronMesh.position.z = r * Math.sin(electronAngle);
    }

    qControls.update();
    qRenderer.render(qScene, qCamera);
}

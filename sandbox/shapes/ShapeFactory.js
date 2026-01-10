import * as THREE from "three";

/**
 * ShapeFactory - Creates THREE.js geometries and materials
 */
export class ShapeFactory {
	static createGeometry(shapeName) {
		switch(shapeName) {
			case 'box':
				return new THREE.BoxGeometry(1, 1, 1);
			case 'capsule':
				return new THREE.CapsuleGeometry(0.5, 0.5, 4, 8);
			case 'circle':
				return new THREE.CircleGeometry(1, 32);
			case 'cone':
				return new THREE.ConeGeometry(1, 2, 32);
			case 'cylinder':
				return new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
			case 'dodecahedron':
				return new THREE.DodecahedronGeometry(1);
			case 'icosahedron':
				return new THREE.IcosahedronGeometry(1);
			case 'octahedron':
				return new THREE.OctahedronGeometry(1);
			case 'ring':
				return new THREE.RingGeometry(0.5, 1, 32);
			case 'sphere':
				return new THREE.SphereGeometry(1, 32, 32);
			case 'tetrahedron':
				return new THREE.TetrahedronGeometry(1);
			case 'torus':
				return new THREE.TorusGeometry(0.7, 0.3, 16, 100);
			case 'torusKnot':
				return new THREE.TorusKnotGeometry(0.7, 0.2, 100, 16);
			default:
				return new THREE.BoxGeometry(1, 1, 1);
		}
	}
	
	static createMaterial(materialType, options = {}) {
		const config = {
			color: options.color || '#1ea8fc',
			wireframe: options.wireframe || false
		};
		
		switch(materialType) {
			case 'phong':
				return new THREE.MeshPhongMaterial(config);
			case 'lambert':
				return new THREE.MeshLambertMaterial(config);
			case 'basic':
				return new THREE.MeshBasicMaterial(config);
			case 'standard':
			default:
				return new THREE.MeshStandardMaterial(config);
		}
	}
	
	static createMesh(shapeName, materialType, materialOptions = {}) {
		const geometry = this.createGeometry(shapeName);
		const material = this.createMaterial(materialType, materialOptions);
		return new THREE.Mesh(geometry, material);
	}
	
	static getAvailableShapes() {
		return [
			'box', 'capsule', 'circle', 'cone', 'cylinder',
			'dodecahedron', 'icosahedron', 'octahedron',
			'ring', 'sphere', 'tetrahedron', 'torus', 'torusKnot'
		];
	}
	
	static getAvailableMaterials() {
		return ['standard', 'phong', 'lambert', 'basic'];
	}
}

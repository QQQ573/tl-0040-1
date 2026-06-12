import Phaser from 'phaser';
import levelData from '../config/level1.json';
import labels from '../config/labels.json';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        this.load.json('levelData', levelData as any);
        this.load.json('labels', labels as any);
    }

    create(): void {
        this.registry.set('levelData', levelData);
        this.registry.set('labels', labels);
        this.scene.start('MenuScene');
    }
}

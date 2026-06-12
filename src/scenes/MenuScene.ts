import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

        this.add.text(width / 2, 100, '手机售后门店模拟器', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(width / 2, 160, '—— 实习前台特训营 ——', {
            fontSize: '24px',
            color: '#95a5a6',
        }).setOrigin(0.5);

        const rules = [
            '📱 扮演实习前台，在10分钟营业日内接待8位顾客',
            '🔧 完成接待、初检、报价、取机通知四步流程',
            '⚠️ 遵守规则：碎屏先报价、进水先断电、电池鼓包单独隔离',
            '💯 客户满意度低于65分则关卡失败',
            '📋 每关结束展示平均接待时长与失误列表',
        ];

        rules.forEach((rule, i) => {
            this.add.text(width / 2, 240 + i * 40, rule, {
                fontSize: '20px',
                color: '#ecf0f1',
            }).setOrigin(0.5);
        });

        const startButton = this.add.rectangle(width / 2, 520, 280, 70, 0x27ae60)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startButton.setFillStyle(0x2ecc71))
            .on('pointerout', () => startButton.setFillStyle(0x27ae60))
            .on('pointerdown', () => this.scene.start('GameScene'));

        this.add.text(width / 2, 520, '开始营业', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(width / 2, 650, '提示：请仔细阅读关卡提示卡片，避免操作失误', {
            fontSize: '16px',
            color: '#95a5a6',
        }).setOrigin(0.5);
    }
}

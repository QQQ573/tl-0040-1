import Phaser from 'phaser';
import { GameResult, MistakeRecord } from '../types/game';

export class ResultScene extends Phaser.Scene {
    private result!: GameResult;

    constructor() {
        super('ResultScene');
    }

    init(): void {
        this.result = this.registry.get('gameResult') as GameResult;
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

        const titleText = this.result.passed ? '🎉 关卡通过！' : '💔 关卡失败';
        const titleColor = this.result.passed ? '#2ecc71' : '#e74c3c';

        this.add.text(width / 2, 60, titleText, {
            fontSize: '40px',
            color: titleColor,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.showStats(width, height);
        this.showMistakes(width, height);
        this.showButtons(width, height);
    }

    private showStats(width: number, _height: number): void {
        const container = this.add.container(width / 2, 150);

        const bg = this.add.rectangle(0, 0, 500, 140, 0x34495e)
            .setStrokeStyle(2, 0x2c3e50);

        const stats = [
            { label: '完成接待', value: `${this.result.completedCustomers} / ${this.result.totalCustomers} 位顾客`, color: '#ffffff' },
            { label: '平均接待时长', value: `${this.result.averageDuration.toFixed(1)} 秒/人`, color: '#ffffff' },
            { label: '最终客户满意度', value: `${this.result.satisfaction} 分`, color: this.result.satisfaction >= 65 ? '#2ecc71' : '#e74c3c' },
        ];

        stats.forEach((stat, i) => {
            const y = -40 + i * 40;
            this.add.text(-220, y, stat.label, {
                fontSize: '18px',
                color: '#95a5a6',
            }).setOrigin(0, 0.5);

            this.add.text(220, y, stat.value, {
                fontSize: '18px',
                color: stat.color,
                fontStyle: 'bold',
            }).setOrigin(1, 0.5);

            container.add([]);
        });

        container.add([bg]);
    }

    private showMistakes(width: number, height: number): void {
        const title = this.add.text(width / 2, 260, '📋 失误记录', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        if (this.result.mistakes.length === 0) {
            this.add.text(width / 2, 320, '✨ 完美！没有任何操作失误', {
                fontSize: '20px',
                color: '#2ecc71',
                fontStyle: 'bold',
            }).setOrigin(0.5);
            return;
        }

        const scrollBg = this.add.rectangle(width / 2, 420, 700, 240, 0x2c3e50)
            .setStrokeStyle(2, 0x34495e);

        const phaseLabels: Record<string, string> = {
            reception: '接待',
            inspection: '初检',
            quotation: '报价',
            notification: '通知',
        };

        this.result.mistakes.slice(0, 6).forEach((mistake: MistakeRecord, i: number) => {
            const y = 300 + i * 38;
            const phase = phaseLabels[mistake.phase] || mistake.phase;

            this.add.text(330, y, `[${phase}]`, {
                fontSize: '14px',
                color: '#f39c12',
                fontStyle: 'bold',
            });

            this.add.text(420, y, mistake.description, {
                fontSize: '14px',
                color: '#ecf0f1',
                wordWrap: { width: 400 },
            });

            this.add.text(width - 330, y, `-${mistake.penalty}`, {
                fontSize: '14px',
                color: '#e74c3c',
                fontStyle: 'bold',
            }).setOrigin(1, 0);
        });

        if (this.result.mistakes.length > 6) {
            this.add.text(width / 2, 530, `...还有 ${this.result.mistakes.length - 6} 条失误记录`, {
                fontSize: '14px',
                color: '#95a5a6',
            }).setOrigin(0.5);
        }
    }

    private showButtons(width: number, height: number): void {
        const retryBtn = this.add.rectangle(width / 2 - 120, height - 60, 200, 60, 0xe67e22)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => retryBtn.setFillStyle(0xf39c12))
            .on('pointerout', () => retryBtn.setFillStyle(0xe67e22))
            .on('pointerdown', () => this.scene.start('GameScene'));

        const retryText = this.add.text(width / 2 - 120, height - 60, '再来一次', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const menuBtn = this.add.rectangle(width / 2 + 120, height - 60, 200, 60, 0x3498db)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => menuBtn.setFillStyle(0x2980b9))
            .on('pointerout', () => menuBtn.setFillStyle(0x3498db))
            .on('pointerdown', () => this.scene.start('MenuScene'));

        const menuText = this.add.text(width / 2 + 120, height - 60, '返回主菜单', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
    }
}

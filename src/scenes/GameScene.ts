import Phaser from 'phaser';
import { Customer, GameState, GamePhase, RuleCard, MistakeRecord, LevelConfig } from '../types/game';
import labels from '../config/labels.json';

export class GameScene extends Phaser.Scene {
    private levelConfig!: LevelConfig;
    private gameState!: GameState;
    private labels: any;
    private uiLayer!: Phaser.GameObjects.Container;
    private timerEvent?: Phaser.Time.TimerEvent;

    private satisfactionText!: Phaser.GameObjects.Text;
    private timeText!: Phaser.GameObjects.Text;
    private queueContainer!: Phaser.GameObjects.Container;
    private workAreaContainer!: Phaser.GameObjects.Container;
    private ruleCardContainer!: Phaser.GameObjects.Container;

    private draggedTag?: Phaser.GameObjects.Container;
    private placedTags: Map<string, string> = new Map();
    private quoteInputText: string = '';
    private quoteInputDisplay!: Phaser.GameObjects.Text;

    constructor() {
        super('GameScene');
    }

    init(): void {
        this.levelConfig = this.registry.get('levelData') as LevelConfig;
        this.labels = this.registry.get('labels') || labels;
        this.gameState = {
            phase: 'intro',
            currentCustomerIndex: 0,
            satisfaction: 100,
            timeRemaining: this.levelConfig.duration,
            startTime: Date.now(),
            customerStartTimes: new Map(),
            customerDurations: new Map(),
            mistakes: [],
            completedCustomers: [],
        };
    }

    create(): void {
        this.createBackground();
        this.createTopBar();
        this.createQueueArea();
        this.createWorkArea();
        this.createRuleCardArea();
        this.showIntro();
    }

    private createBackground(): void {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);

        this.add.rectangle(width / 2, 300, width, 450, 0x34495e);
        this.add.rectangle(200, 300, 300, 450, 0x3d566e);
        this.add.rectangle(800, 300, 800, 450, 0x3d566e);

        this.add.text(200, 120, '等候区', { fontSize: '20px', color: '#95a5a6' }).setOrigin(0.5);
        this.add.text(800, 120, '工作台', { fontSize: '20px', color: '#95a5a6' }).setOrigin(0.5);
    }

    private createTopBar(): void {
        const { width } = this.scale;

        this.add.rectangle(width / 2, 40, width, 80, 0x1a252f);

        this.satisfactionText = this.add.text(100, 40, '客户满意度: 100', {
            fontSize: '22px',
            color: '#2ecc71',
            fontStyle: 'bold',
        }).setOrigin(0, 0.5);

        this.timeText = this.add.text(width - 100, 40, '剩余时间: 10:00', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(1, 0.5);

        this.add.text(width / 2, 40, `第 ${this.levelConfig.id} 关 · ${this.levelConfig.name}`, {
            fontSize: '18px',
            color: '#bdc3c7',
        }).setOrigin(0.5);
    }

    private createQueueArea(): void {
        this.queueContainer = this.add.container(200, 180);
    }

    private createWorkArea(): void {
        this.workAreaContainer = this.add.container(800, 180);
    }

    private createRuleCardArea(): void {
        const { width } = this.scale;
        this.ruleCardContainer = this.add.container(width / 2, this.scale.height - 80);
    }

    private showIntro(): void {
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

        const card = this.add.container(width / 2, height / 2);
        const bg = this.add.rectangle(0, 0, 600, 400, 0xffffff);
        const title = this.add.text(0, -150, '📱 营业开始', {
            fontSize: '32px',
            color: '#2c3e50',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const tips: string[] = [
            '• 你将在10分钟内接待8位顾客',
            '• 流程：接待 → 初检 → 报价 → 取机通知',
            '• 请留意弹出的规则提示卡片',
            '• 操作失误会扣除客户满意度',
            `• 满意度低于 ${this.levelConfig.passScore} 分将关卡失败`,
        ];

        const tipTexts = tips.map((tip, i) =>
            this.add.text(-250, -60 + i * 40, tip, {
                fontSize: '18px',
                color: '#34495e',
            })
        );

        const startBtn = this.add.rectangle(0, 120, 200, 60, 0x27ae60)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startBtn.setFillStyle(0x2ecc71))
            .on('pointerout', () => startBtn.setFillStyle(0x27ae60))
            .on('pointerdown', () => {
                overlay.destroy();
                card.destroy();
                this.startGame();
            });

        const startText = this.add.text(0, 120, '开始接待', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        card.add([bg, title, ...tipTexts, startBtn, startText]);
    }

    private startGame(): void {
        this.gameState.phase = 'queue';
        this.gameState.startTime = Date.now();
        this.startTimer();
        this.updateQueue();
    }

    private startTimer(): void {
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameState.timeRemaining--;
                this.updateTimeDisplay();
                if (this.gameState.timeRemaining <= 0) {
                    this.endLevel(false);
                }
            },
            loop: true,
        });
    }

    private updateTimeDisplay(): void {
        const mins = Math.floor(this.gameState.timeRemaining / 60);
        const secs = this.gameState.timeRemaining % 60;
        this.timeText.setText(`剩余时间: ${mins}:${secs.toString().padStart(2, '0')}`);
        if (this.gameState.timeRemaining <= 60) {
            this.timeText.setColor('#e74c3c');
        }
    }

    private updateSatisfactionDisplay(): void {
        this.satisfactionText.setText(`客户满意度: ${this.gameState.satisfaction}`);
        if (this.gameState.satisfaction >= 80) {
            this.satisfactionText.setColor('#2ecc71');
        } else if (this.gameState.satisfaction >= 65) {
            this.satisfactionText.setColor('#f39c12');
        } else {
            this.satisfactionText.setColor('#e74c3c');
        }
        if (this.gameState.satisfaction < this.levelConfig.passScore) {
            this.endLevel(false);
        }
    }

    private updateQueue(): void {
        this.queueContainer.removeAll(true);
        const remainingCustomers = this.levelConfig.customers.slice(this.gameState.currentCustomerIndex);

        remainingCustomers.forEach((customer, index) => {
            const y = index * 55;
            const isFirst = index === 0;
            const bgColor = isFirst ? 0x3498db : 0x95a5a6;

            const bg = this.add.rectangle(0, y, 260, 45, bgColor);
            if (isFirst) {
                bg.setStrokeStyle(3, 0x2980b9);
            }

            const numberText = this.add.text(-110, y, `#${customer.id}`, {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0, 0.5);

            const nameText = this.add.text(-60, y, customer.name, {
                fontSize: '16px',
                color: '#ffffff',
            }).setOrigin(0, 0.5);

            const statusText = this.add.text(80, y, isFirst ? '→ 叫号中' : '等候中', {
                fontSize: '14px',
                color: isFirst ? '#ffeaa7' : '#ecf0f1',
            }).setOrigin(1, 0.5);

            this.queueContainer.add([bg, numberText, nameText, statusText]);

            if (isFirst) {
                bg.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => bg.setFillStyle(0x2980b9))
                    .on('pointerout', () => bg.setFillStyle(0x3498db))
                    .on('pointerdown', () => this.callNextCustomer());
            }
        });

        if (remainingCustomers.length === 0) {
            this.endLevel(true);
        }
    }

    private callNextCustomer(): void {
        const customer = this.levelConfig.customers[this.gameState.currentCustomerIndex];
        if (!customer) return;

        this.gameState.customerStartTimes.set(customer.id, Date.now());
        this.gameState.phase = 'reception';
        this.showReceptionPhase(customer);
    }

    private showReceptionPhase(customer: Customer): void {
        this.workAreaContainer.removeAll(true);
        this.showRuleCards(customer);
        this.createCustomerHeader(customer, 1);

        const phaseTitle = this.add.text(0, 80, '【第一步】选择受理类型', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.workAreaContainer.add(phaseTitle);

        const serviceTypes: { key: string; label: string; color: number }[] = [
            { key: 'screen_repair', label: '🖥️ 屏幕维修', color: 0xe74c3c },
            { key: 'water_repair', label: '💧 进水维修', color: 0x3498db },
            { key: 'battery_repair', label: '🔋 电池更换', color: 0xf39c12 },
            { key: 'general_repair', label: '🔧 综合维修', color: 0x9b59b6 },
            { key: 'diagnosis', label: '🔍 故障检测', color: 0x1abc9c },
        ];

        serviceTypes.forEach((type, i) => {
            const x = (i % 3) * 200 - 200;
            const y = 150 + Math.floor(i / 3) * 80;

            const btn = this.add.rectangle(x, y, 180, 60, type.color)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0xffffff, 0.3)
                .on('pointerover', () => btn.setScale(1.05))
                .on('pointerout', () => btn.setScale(1))
                .on('pointerdown', () => {
                    this.validateServiceType(customer, type.key);
                });

            const btnText = this.add.text(x, y, type.label, {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5);

            this.workAreaContainer.add([btn, btnText]);
        });
    }

    private validateServiceType(customer: Customer, selected: string): void {
        if (selected === customer.correctServiceType) {
            this.gameState.phase = 'inspection';
            this.showInspectionPhase(customer);
        } else {
            const label = (this.labels.serviceTypes as any)[selected] || selected;
            this.addMistake(customer.id, 'reception', `接待${customer.name}时错误选择了"${label}"`, 8);
            this.shakeWorkArea();
        }
    }

    private showInspectionPhase(customer: Customer): void {
        this.workAreaContainer.removeAll(true);
        this.placedTags.clear();
        this.createCustomerHeader(customer, 2);

        const phaseTitle = this.add.text(0, 80, '【第二步】初检 - 拖拽故障标签到对应区域', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.workAreaContainer.add(phaseTitle);

        const phoneAreas = [
            { key: 'display_area', label: '显示区域', x: 0, y: 160, color: 0x2980b9 },
            { key: 'power_area', label: '电源区域', x: -180, y: 160, color: 0xf39c12 },
            { key: 'audio_area', label: '音频区域', x: 180, y: 160, color: 0x9b59b6 },
            { key: 'camera_area', label: '摄像区域', x: -180, y: 280, color: 0x27ae60 },
            { key: 'button_area', label: '按键区域', x: 0, y: 280, color: 0xe67e22 },
            { key: 'charging_area', label: '充电区域', x: 180, y: 280, color: 0x16a085 },
        ];

        const areaZones: Map<string, Phaser.Geom.Rectangle> = new Map();

        phoneAreas.forEach(area => {
            const bg = this.add.rectangle(area.x, area.y, 140, 90, area.color, 0.7)
                .setStrokeStyle(2, 0xffffff, 0.5);
            const label = this.add.text(area.x, area.y, area.label, {
                fontSize: '15px',
                color: '#ffffff',
                fontStyle: 'bold',
                wordWrap: { width: 120 },
            }).setOrigin(0.5);

            const zone = new Phaser.Geom.Rectangle(
                area.x - 70,
                area.y - 45,
                140, 90
            );
            areaZones.set(area.key, zone);

            this.workAreaContainer.add([bg, label]);
        });

        const availableTags = [...new Set([...customer.faultTags, ...customer.correctTags])];

        availableTags.forEach((tag, i) => {
            const x = (i - (availableTags.length - 1) / 2) * 120;
            this.createDraggableTag(tag, x, 400, areaZones);
        });

        const confirmBtn = this.add.rectangle(0, 490, 200, 50, 0x27ae60)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => confirmBtn.setFillStyle(0x2ecc71))
            .on('pointerout', () => confirmBtn.setFillStyle(0x27ae60))
            .on('pointerdown', () => this.validateInspection(customer));

        const confirmText = this.add.text(0, 490, '确认初检结果', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.workAreaContainer.add([confirmBtn, confirmText]);
    }

    private createDraggableTag(
        tag: string,
        x: number,
        y: number,
        areaZones: Map<string, Phaser.Geom.Rectangle>
    ): void {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 110, 40, 0xe74c3c)
            .setStrokeStyle(2, 0xc0392b);

        const text = this.add.text(0, 0, tag, {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        container.add([bg, text]);
        (container as any).tagName = tag;
        (container as any).originalX = x;
        (container as any).originalY = y;

        this.workAreaContainer.add(container);

        this.input.setDraggable(bg);

        bg.on('dragstart', () => {
            this.draggedTag = container;
            container.setScale(1.1);
            this.workAreaContainer.bringToTop(container);
        });

        bg.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            const localX = dragX - this.workAreaContainer.x;
            const localY = dragY - this.workAreaContainer.y;
            container.x = localX;
            container.y = localY;
        });

        bg.on('dragend', () => {
            container.setScale(1);
            
            const localX = container.x;
            const localY = container.y;

            let matchedArea: string | null = null;
            areaZones.forEach((zone, areaKey) => {
                if (zone.contains(localX, localY)) {
                    matchedArea = areaKey;
                }
            });

            if (matchedArea) {
                this.placedTags.set(tag, matchedArea);
                bg.setFillStyle(0x27ae60);
                bg.setStrokeStyle(2, 0x1e8449);
            } else {
                this.placedTags.delete(tag);
                bg.setFillStyle(0xe74c3c);
                bg.setStrokeStyle(2, 0xc0392b);
                container.x = (container as any).originalX;
                container.y = (container as any).originalY;
            }

            this.draggedTag = undefined;
        });
    }

    private validateInspection(customer: Customer): void {
        const tagAreaMapping = this.labels.tagAreaMapping as Record<string, string>;
        let allCorrect = true;

        customer.correctTags.forEach(tag => {
            const expectedArea = tagAreaMapping[tag];
            const placedArea = this.placedTags.get(tag);
            if (expectedArea && placedArea !== expectedArea) {
                allCorrect = false;
                this.addMistake(customer.id, 'inspection', `初检${customer.name}时"${tag}"分类错误`, 6);
            }
        });

        if (allCorrect) {
            this.gameState.phase = 'quotation';
            this.showQuotationPhase(customer);
        } else {
            this.shakeWorkArea();
        }
    }

    private showQuotationPhase(customer: Customer): void {
        this.workAreaContainer.removeAll(true);
        this.quoteInputText = '';
        this.createCustomerHeader(customer, 3);

        const phaseTitle = this.add.text(0, 80, '【第三步】报价 - 输入配件费用（元）', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const hint = this.add.text(0, 130,
            `参考价格范围: ¥${customer.priceRange.min} - ¥${customer.priceRange.max}`,
            { fontSize: '16px', color: '#bdc3c7' }).setOrigin(0.5);

        this.workAreaContainer.add([phaseTitle, hint]);

        const inputBg = this.add.rectangle(0, 200, 300, 80, 0x1a252f)
            .setStrokeStyle(3, 0x3498db);

        this.quoteInputDisplay = this.add.text(0, 200, '¥ ', {
            fontSize: '36px',
            color: '#2ecc71',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.workAreaContainer.add([inputBg, this.quoteInputDisplay]);

        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'];
        keys.forEach((key, i) => {
            const x = (i % 3) * 100 - 100;
            const y = 280 + Math.floor(i / 3) * 55;
            const isSpecial = key === 'C' || key === '←';

            const btn = this.add.rectangle(x, y, 90, 45, isSpecial ? 0xe74c3c : 0x34495e)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => btn.setFillStyle(isSpecial ? 0xc0392b : 0x4a6278))
                .on('pointerout', () => btn.setFillStyle(isSpecial ? 0xe74c3c : 0x34495e))
                .on('pointerdown', () => this.handleQuoteInput(key, customer));

            const btnText = this.add.text(x, y, key, {
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5);

            this.workAreaContainer.add([btn, btnText]);
        });

        const confirmBtn = this.add.rectangle(0, 480, 200, 50, 0x27ae60)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => confirmBtn.setFillStyle(0x2ecc71))
            .on('pointerout', () => confirmBtn.setFillStyle(0x27ae60))
            .on('pointerdown', () => this.validateQuote(customer));

        const confirmText = this.add.text(0, 480, '确认报价', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.workAreaContainer.add([confirmBtn, confirmText]);
    }

    private handleQuoteInput(key: string, _customer: Customer): void {
        if (key === 'C') {
            this.quoteInputText = '';
        } else if (key === '←') {
            this.quoteInputText = this.quoteInputText.slice(0, -1);
        } else if (this.quoteInputText.length < 5) {
            this.quoteInputText += key;
        }
        this.quoteInputDisplay.setText(`¥ ${this.quoteInputText || ' '}`);
    }

    private validateQuote(customer: Customer): void {
        if (!this.quoteInputText) return;

        const price = parseInt(this.quoteInputText, 10);
        if (isNaN(price)) return;

        if (price >= customer.priceRange.min && price <= customer.priceRange.max) {
            this.gameState.phase = 'notification';
            this.showNotificationPhase(customer);
        } else {
            this.addMistake(
                customer.id,
                'quotation',
                `为${customer.name}报价¥${price}，合理范围为¥${customer.priceRange.min}-¥${customer.priceRange.max}`,
                10
            );
            this.shakeWorkArea();
        }
    }

    private showNotificationPhase(customer: Customer): void {
        this.workAreaContainer.removeAll(true);
        this.createCustomerHeader(customer, 4);

        const phaseTitle = this.add.text(0, 80, '【第四步】取机通知 - 点击发送短信', {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.workAreaContainer.add(phaseTitle);

        const phoneBg = this.add.rectangle(0, 250, 300, 420, 0x1a252f, 0.9)
            .setStrokeStyle(3, 0x3498db, 0.8);

        const smsHeader = this.add.text(0, 80, '📱 短信编辑', {
            fontSize: '20px',
            color: '#3498db',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const smsContent = this.add.text(-130, 130,
            `尊敬的${customer.name}：\n\n您的${customer.phoneModel}\n维修已完成，请携带\n取机凭证到店取机。\n\n售后门店`,
            {
                fontSize: '16px',
                color: '#ffffff',
                lineSpacing: 8,
            }
        );

        const sendBtn = this.add.rectangle(0, 380, 200, 60, 0x27ae60)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => sendBtn.setFillStyle(0x2ecc71))
            .on('pointerout', () => sendBtn.setFillStyle(0x27ae60))
            .on('pointerdown', () => this.sendNotification(customer));

        const sendText = this.add.text(0, 380, '📨 发送取机短信', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.workAreaContainer.add([phoneBg, smsHeader, smsContent, sendBtn, sendText]);
    }

    private sendNotification(customer: Customer): void {
        const startTime = this.gameState.customerStartTimes.get(customer.id);
        if (startTime) {
            const duration = (Date.now() - startTime) / 1000;
            this.gameState.customerDurations.set(customer.id, duration);
        }

        this.gameState.completedCustomers.push(customer.id);
        this.gameState.currentCustomerIndex++;
        this.gameState.phase = 'queue';

        this.workAreaContainer.removeAll(true);
        this.ruleCardContainer.removeAll(true);

        if (this.gameState.currentCustomerIndex >= this.levelConfig.customers.length) {
            this.endLevel(true);
        } else {
            this.updateQueue();
        }
    }

    private createCustomerHeader(customer: Customer, step: number): void {
        const bg = this.add.rectangle(0, 20, 500, 50, 0x2980b9)
            .setStrokeStyle(2, 0x1f618d);

        const stepText = this.add.text(-230, 20, `步骤 ${step}/4`, {
            fontSize: '16px',
            color: '#ffeaa7',
            fontStyle: 'bold',
        }).setOrigin(0, 0.5);

        const infoText = this.add.text(0, 20,
            `${customer.name} | ${customer.phoneBrand} ${customer.phoneModel}`,
            { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);

        this.workAreaContainer.add([bg, stepText, infoText]);
    }

    private showRuleCards(customer: Customer): void {
        this.ruleCardContainer.removeAll(true);

        const applicableRules = this.levelConfig.ruleCards.filter(rule => {
            if (!rule.condition) return false;
            if (rule.condition.brand && rule.condition.brand !== customer.phoneBrand) return false;
            if (rule.condition.faultType && rule.condition.faultType !== customer.faultType) return false;
            if (rule.condition.isFoldable !== undefined && rule.condition.isFoldable !== customer.isFoldable) return false;
            return true;
        });

        if (applicableRules.length === 0) return;

        applicableRules.forEach((rule, i) => {
            const x = (i - (applicableRules.length - 1) / 2) * 320;

            const cardBg = this.add.rectangle(x, 0, 300, 120, 0xf39c12)
                .setStrokeStyle(3, 0xe67e22);

            const title = this.add.text(x, -40, `⚠️ ${rule.title}`, {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold',
            }).setOrigin(0.5);

            const content = this.add.text(x, 10, rule.content, {
                fontSize: '14px',
                color: '#ffffff',
                wordWrap: { width: 280 },
                align: 'center',
            }).setOrigin(0.5);

            this.ruleCardContainer.add([cardBg, title, content]);
        });

        this.time.delayedCall(5000, () => {
            this.ruleCardContainer.removeAll(true);
        });
    }

    private addMistake(customerId: number, phase: GamePhase, description: string, penalty: number): void {
        const mistake: MistakeRecord = { customerId, phase, description, penalty };
        this.gameState.mistakes.push(mistake);
        this.gameState.satisfaction = Math.max(0, this.gameState.satisfaction - penalty);
        this.updateSatisfactionDisplay();
        this.showMistakePopup(description, penalty);
    }

    private showMistakePopup(description: string, penalty: number): void {
        const { width } = this.scale;
        const popup = this.add.container(width / 2, 200);

        const bg = this.add.rectangle(0, 0, 500, 80, 0xe74c3c)
            .setStrokeStyle(3, 0xc0392b);

        const text1 = this.add.text(0, -15, '❌ 操作失误！', {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const text2 = this.add.text(0, 15, `${description} (-${penalty}分)`, {
            fontSize: '16px',
            color: '#ffeaa7',
        }).setOrigin(0.5);

        popup.add([bg, text1, text2]);

        this.tweens.add({
            targets: popup,
            alpha: { from: 0, to: 1 },
            y: 150,
            duration: 300,
            yoyo: true,
            hold: 2000,
            onComplete: () => popup.destroy(),
        });
    }

    private shakeWorkArea(): void {
        this.tweens.add({
            targets: this.workAreaContainer,
            x: '+=10',
            duration: 50,
            yoyo: true,
            repeat: 5,
            onComplete: () => this.workAreaContainer.setX(800),
        });
    }

    private endLevel(completed: boolean): void {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }

        const durations = Array.from(this.gameState.customerDurations.values());
        const avgDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        const result = {
            totalCustomers: this.levelConfig.customerCount,
            completedCustomers: this.gameState.completedCustomers.length,
            averageDuration: avgDuration,
            satisfaction: this.gameState.satisfaction,
            mistakes: this.gameState.mistakes,
            passed: this.gameState.satisfaction >= this.levelConfig.passScore && completed,
        };

        this.registry.set('gameResult', result);
        this.scene.start('ResultScene');
    }
}

export type PhoneBrand = 'iPhone' | 'Samsung' | 'Huawei' | 'Xiaomi' | 'OPPO';

export type FaultType = 'screen_crack' | 'water_damage' | 'battery_swelling' | 'no_power' | 'speaker_issue' | 'camera_issue' | 'button_issue' | 'charging_issue';

export type ServiceType = 'screen_repair' | 'water_repair' | 'battery_repair' | 'general_repair' | 'diagnosis';

export type GamePhase = 'menu' | 'intro' | 'queue' | 'reception' | 'inspection' | 'quotation' | 'notification' | 'result';

export interface Customer {
    id: number;
    name: string;
    phoneBrand: PhoneBrand;
    phoneModel: string;
    faultType: FaultType;
    correctServiceType: ServiceType;
    correctPrice: number;
    priceRange: { min: number; max: number };
    faultTags: string[];
    correctTags: string[];
    specialRules?: string[];
    isFoldable?: boolean;
    isWaterDamaged?: boolean;
}

export interface LevelConfig {
    id: number;
    name: string;
    duration: number;
    customerCount: number;
    passScore: number;
    customers: Customer[];
    ruleCards: RuleCard[];
}

export interface RuleCard {
    id: string;
    title: string;
    content: string;
    condition?: {
        brand?: PhoneBrand;
        faultType?: FaultType;
        isFoldable?: boolean;
    };
}

export interface MistakeRecord {
    customerId: number;
    phase: GamePhase;
    description: string;
    penalty: number;
}

export interface GameResult {
    totalCustomers: number;
    completedCustomers: number;
    averageDuration: number;
    satisfaction: number;
    mistakes: MistakeRecord[];
    passed: boolean;
}

export interface GameState {
    phase: GamePhase;
    currentCustomerIndex: number;
    satisfaction: number;
    timeRemaining: number;
    startTime: number;
    customerStartTimes: Map<number, number>;
    customerDurations: Map<number, number>;
    mistakes: MistakeRecord[];
    completedCustomers: number[];
}

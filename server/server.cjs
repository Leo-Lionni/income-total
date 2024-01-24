"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3 = __importStar(require("better-sqlite3"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// 初始化SQLite数据库连接
const db = new sqlite3.default('./database.sqlite');
// 创建DailyStatistic表（如果不存在）
db.exec(`
  CREATE TABLE IF NOT EXISTS DailyStatistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    morningReading BOOLEAN NOT NULL,
    noonPractice BOOLEAN NOT NULL,
    eveningPractice BOOLEAN NOT NULL,
    eveningStudy BOOLEAN NOT NULL
  );
`);
// 将每日统计数据保存到SQLite数据库
// async function saveDailyStatistics(statistics: DailyStatistic[]): Promise<void> {
//   const insertStatement = db.prepare('INSERT INTO DailyStatistics (date, morningReading, noonPractice, eveningPractice, eveningStudy) VALUES (?, ?, ?, ?, ?)');
//   for (const stat of statistics) {
//     insertStatement.run(
//       stat.date.toISOString().slice(0, 19).replace('T', ' '), // SQLite日期格式化
//       Number(stat.morningReading),
//       Number(stat.noonPractice),
//       Number(stat.eveningPractice),
//       Number(stat.eveningStudy)
//     );
//   }
// }
function saveDailyStatisticsWithoutDuplicates(statistics) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(statistics);
        const insertStatement = db.prepare('INSERT INTO DailyStatistics (date, morningReading, noonPractice, eveningPractice, eveningStudy) VALUES (?, ?, ?, ?, ?)');
        for (const stat of statistics) {
            // 检查数据库中是否存在相同日期的记录
            const existingStat = db.prepare('SELECT * FROM DailyStatistics WHERE date = ?').get(stat.date.toISOString().slice(0, 10));
            if (!existingStat) {
                // 数据库中没有找到相同日期的记录，插入新的记录
                insertStatement.run(stat.date.toISOString().slice(0, 10), // SQLite日期格式化
                Number(stat.morningReading), Number(stat.noonPractice), Number(stat.eveningPractice), Number(stat.eveningStudy));
            }
        }
    });
}
// 从SQLite数据库获取每日统计数据
function getDailyStatistics() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = db.prepare('SELECT * FROM DailyStatistics').all();
        return rows.map(row => ({
            id: row.id,
            date: new Date(row.date),
            morningReading: row.morningReading === 1,
            noonPractice: row.noonPractice === 1,
            eveningPractice: row.eveningPractice === 1,
            eveningStudy: row.eveningStudy === 1,
        }));
    });
}
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
// /api/save 端点 - 保存每日统计数据
app.post('/api/save', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const statistics = req.body.statistics;
        // 转换ISO日期字符串为Date对象（如果需要）
        const transformedData = statistics.map(stat => (Object.assign(Object.assign({}, stat), { date: new Date(stat.date) })));
        yield saveDailyStatisticsWithoutDuplicates(transformedData);
        res.status(200).json({ message: '数据成功保存' });
    }
    catch (error) {
        console.error('保存数据时出错：', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
}));
// /api/daily-statistics 端点 - 获取每日统计数据
app.get('/api/daily-statistics', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataFromServer = yield getDailyStatistics();
        // 将Date对象转换为ISO格式字符串（如果需要）
        const transformedData = dataFromServer.map(stat => (Object.assign(Object.assign({}, stat), { date: stat.date.toISOString() })));
        res.status(200).json(transformedData);
    }
    catch (error) {
        console.error('获取数据时出错：', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// 在程序关闭时关闭数据库连接
process.on('SIGINT', () => {
    db.close();
    process.exit();
});

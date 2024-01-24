import * as sqlite3 from 'better-sqlite3';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

interface DailyStatistic {
  id: number;
  date: Date;
  morningReading: boolean;
  noonPractice: boolean;
  eveningPractice: boolean;
  eveningStudy: boolean;
}

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
async function saveDailyStatisticsWithoutDuplicates(statistics: DailyStatistic[]): Promise<void> {
  console.log(statistics)
  const insertStatement = db.prepare('INSERT INTO DailyStatistics (date, morningReading, noonPractice, eveningPractice, eveningStudy) VALUES (?, ?, ?, ?, ?)');
  for (const stat of statistics) {
    // 检查数据库中是否存在相同日期的记录
    const existingStat = db.prepare('SELECT * FROM DailyStatistics WHERE date = ?').get(stat.date.toISOString().slice(0,10));
    
    if (!existingStat) {
      // 数据库中没有找到相同日期的记录，插入新的记录
      insertStatement.run(
        stat.date.toISOString().slice(0,10), // SQLite日期格式化
        Number(stat.morningReading),
        Number(stat.noonPractice),
        Number(stat.eveningPractice),
        Number(stat.eveningStudy)
      );
    }
  }
}






// 从SQLite数据库获取每日统计数据
async function getDailyStatistics(): Promise<DailyStatistic[]> {
  const rows = db.prepare('SELECT * FROM DailyStatistics').all() as any[];
  return rows.map(row => ({
    id: row.id,
    date: new Date(row.date),
    morningReading: row.morningReading === 1,
    noonPractice: row.noonPractice === 1,
    eveningPractice: row.eveningPractice === 1,
    eveningStudy: row.eveningStudy === 1,
  }));
}

const app = express();
app.use(bodyParser.json());
app.use(cors());

// /api/save 端点 - 保存每日统计数据
app.post('/api/save', async (req: Request, res: Response) => {
  try {
    const statistics: DailyStatistic[] = req.body.statistics;

    // 转换ISO日期字符串为Date对象（如果需要）
    const transformedData = statistics.map(stat => ({ ...stat, date: new Date(stat.date) }));

    await saveDailyStatisticsWithoutDuplicates(transformedData);

    res.status(200).json({ message: '数据成功保存' });
  } catch (error) {
    console.error('保存数据时出错：', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// /api/daily-statistics 端点 - 获取每日统计数据
app.get('/api/daily-statistics', async (_req: Request, res: Response) => {
  try {
    const dataFromServer = await getDailyStatistics();

    // 将Date对象转换为ISO格式字符串（如果需要）
    const transformedData = dataFromServer.map(stat => ({
      ...stat,
      date: stat.date.toISOString(),
    }));

    res.status(200).json(transformedData);
  } catch (error) {
    console.error('获取数据时出错：', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 在程序关闭时关闭数据库连接
process.on('SIGINT', () => {
  db.close();
  process.exit();
});
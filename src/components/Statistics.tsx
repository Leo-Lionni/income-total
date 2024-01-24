import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker"; // 假设你已安装并导入了 react-datepicker 库
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

type DayCounts = {
  [key in keyof typeof every]: boolean;
};


interface DayCosts {
  morningReading: number;
  noonPractice: number;
  eveningPractice: number;
  eveningStudy: number;
}



const every :DayCosts= {
  morningReading: 30,
  noonPractice: 40,
  eveningPractice: 40,
  eveningStudy: 60,
};

const API_BASE_URL = "http://localhost:3000/api";

function DailyStatistics() {
  const [dayData, setDayData] = useState<
    {
      date: Date;
      counts: DayCounts;
      morningReadingCost: number;
      noonPracticeCost: number;
      eveningPracticeCost: number;
      eveningStudyCost: number;
    }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/daily-statistics`);
        if (response.status === 200) {
          const dataFromServer = response.data.map((item: any) => ({
            date: new Date(item.date), // 将ISO字符串转换回Date对象
            counts: {
              morningReading: item.morningReading,
              noonPractice: item.noonPractice,
              eveningPractice: item.eveningPractice,
              eveningStudy: item.eveningStudy,
            },
            morningReadingCost: item.morningReading ? every.morningReading : 0,
            noonPracticeCost: item.noonPractice ? every.noonPractice : 0,
            eveningPracticeCost: item.eveningPractice
              ? every.eveningPractice
              : 0,
            eveningStudyCost: item.eveningStudy ? every.eveningStudy : 0,
          }));
          setDayData(dataFromServer);
        }
      } catch (error) {
        console.error("获取数据时出错：", error);
      }
    };

    fetchData();
  }, []); // 空数组作为依赖项表示仅在组件挂载时执行一次

  // 计算单日总费用
  const calculateDayCost = (counts: DayCounts) =>
    Object.entries(counts)
      .filter(([, isSelected]) => isSelected)
      .reduce(
        (acc, [type, isSelected]) => acc + (isSelected ? every[type as keyof  DayCosts] : 0),
        0
      );

  // 更新数量的方法（这里假设日期通过一个日期选择器组件获取）
  const handleCheckboxChange =
    (index: number, type: keyof typeof every) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDayData((prevData) =>
        prevData.map((item, i) => {
          if (i === index) {
            return {
              ...item,
              counts: { ...item.counts, [type]: event.target.checked },
            };
          }
          return item;
        })
      );
    };

  const addNewDay = (date: Date) => {
    // 检查是否已存在所选日期的记录
    const existingDateIndex = dayData.findIndex(
      (item) => item.date.toDateString() === date.toDateString()
    );

    if (existingDateIndex === -1) {
      setDayData([
        ...dayData,
        {
          date,
          counts: {
            morningReading: false,
            noonPractice: false,
            eveningPractice: false,
            eveningStudy: false,
          },
          morningReadingCost: 0,
          noonPracticeCost: 0,
          eveningPracticeCost: 0,
          eveningStudyCost: 0,
        },
      ]);
    } else {
      console.warn("所选日期已存在，不能重复添加");
      window.alert("所选日期已存在，不能重复添加");
    }
  };

  // 发送至后端
  const sendDataToBackend = async () => {
    try {
      const statistics = dayData.map(({ date, counts }) => ({
        date: date.toISOString().slice(0, 10), // 转换为ISO格式字符串以便后端处理
        morningReading: Number(counts.morningReading),
        noonPractice: Number(counts.noonPractice),
        eveningPractice: Number(counts.eveningPractice),
        eveningStudy: Number(counts.eveningStudy),
        morningReadingCost: counts.morningReading ? every.morningReading : 0,
        noonPracticeCost: counts.noonPractice ? every.noonPractice : 0,
        eveningPracticeCost: counts.eveningPractice ? every.eveningPractice : 0,
        eveningStudyCost: counts.eveningStudy ? every.eveningStudy : 0,
      }));

      await axios.post(`${API_BASE_URL}/save`, { statistics });
      console.log("数据成功发送到后端");
    } catch (error) {
      console.error("发送数据到后端时出错：", error);
    }
  };
  // 排序
  const sortedDayData = React.useMemo(() => {
    return dayData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dayData]);

  return (
    <div>
      <label>新增    </label>
      <DatePicker
        selected={dayData[dayData.length - 1]?.date}
        onChange={(date) => {
          if (date) {
            addNewDay(date);
          } else {
            console.warn("Selected date is null");
          }
        }}
        showTimeSelect={false} // 确保不显示时间选择器
        dateFormat="yyyy-MM-dd" // 只选择日期部分
      />

      {/* <div className="bg-blue-50 p-4">Hello</div> */}
      <h2>
        过去总费用：{dayData.reduce((acc, day) => acc + calculateDayCost(day.counts), 0)} 元
      </h2>
      <h1 className="bg-blue-50 p-4">每日统计</h1>   
      <button onClick={sendDataToBackend}>保存</button>
      <table>
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-primary whitespace-nowrap">日期</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-primary whitespace-nowrap">项目</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-primary whitespace-nowrap">单价（元）</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-primary whitespace-nowrap">参与情况</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-text-primary whitespace-nowrap">小计（元）</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-200">

      
          {sortedDayData.map(({ date, counts }, index) => (
            <>
              <tr
                key={index}
                className="border-b border-primary-300 hover:bg-primary-100 transition duration-150 ease-in-out"
              >
                <td className="py-4 px-6 text-center text-sm leading-5 font-medium text-text-primary whitespace-nowrap">
                  {date.toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  早读
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  {every.morningReading}
                </td>
                <td className="py-4 px-6">


                  <input
                    type="checkbox"
                    checked={counts.morningReading}
                    onChange={(e) =>
                      handleCheckboxChange(index, "morningReading")(e)
                    }
                    className="form-checkbox h-4 w-4 border-transparent text-primary focus:ring-primary-500 hover:bg-primary-100"
                  />


                  
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-primary whitespace-nowrap">
                  {counts.morningReading ? every.morningReading : 0}
                </td>
              </tr>
              <tr
                key={`${index}-noon`}
                className="border-t border-b border-primary-300"
              >
                <td colSpan={1} className="py-4 px-6"></td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  午练
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  {every.noonPractice}
                </td>
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    checked={counts.noonPractice}
                    onChange={(e) =>
                      handleCheckboxChange(index, "noonPractice")(e)
                    }
                    className="form-checkbox h-4 w-4 border-transparent text-primary focus:ring-primary-500 hover:bg-primary-100"
                  />
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-primary whitespace-nowrap">
                  {counts.noonPractice ? every.noonPractice : 0}
                </td>
              </tr>

              {/* 晚练 */}
              <tr
                key={`${index}-eve`}
                className="border-t border-b border-primary-300"
              >
                <td colSpan={1} className="py-4 px-6"></td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  晚练
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  {every.eveningPractice}
                </td>
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    checked={counts.eveningPractice}
                    onChange={(e) =>
                      handleCheckboxChange(index, "eveningPractice")(e)
                    }
                    className="form-checkbox h-4 w-4 border-transparent text-primary focus:ring-primary-500 hover:bg-primary-100"
                  />
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-primary whitespace-nowrap">
                  {counts.eveningPractice ? every.eveningPractice : 0}
                </td>
              </tr>

              {/* 晚自习 */}
              <tr
                key={`${index}-evestudy`}
                className="border-t border-b border-primary-300"
              >
                <td colSpan={1} className="py-4 px-6"></td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  晚自习
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-secondary whitespace-nowrap">
                  {every.eveningStudy}
                </td>
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    checked={counts.eveningStudy}
                    onChange={(e) =>
                      handleCheckboxChange(index, "eveningStudy")(e)
                    }
                    className="form-checkbox h-4 w-4 border-transparent text-primary focus:ring-primary-500 hover:bg-primary-100"
                  />
                </td>
                <td className="py-4 px-6 text-center text-sm leading-5 text-text-primary whitespace-nowrap">
                  {counts.eveningStudy ? every.eveningStudy : 0}
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
     
    </div>
  );
}

export default DailyStatistics;

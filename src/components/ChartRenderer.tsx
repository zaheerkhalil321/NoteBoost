import React from "react";
import { View, Text, Dimensions } from "react-native";
import { ChartData } from "../state/notesStore";
import { CartesianChart, Bar, Line, Area } from "victory-native";

interface ChartRendererProps {
  chart: ChartData;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chart }) => {
  const { width } = Dimensions.get("window");
  const chartWidth = width - 64; // Account for padding
  const chartHeight = 240;

  const getChartColor = (type: string) => {
    const colors: { [key: string]: string } = {
      line: "#0ea5e9",
      bar: "#8b5cf6",
      pie: "#ec4899",
      area: "#10b981",
    };
    return colors[type] || "#0ea5e9";
  };

  const renderChart = () => {
    // Check if we have multiple colors in the data
    const hasMultipleColors = chart.data.some((item) => {
      const itemColor = item.color || getChartColor(chart.type);
      const firstColor = chart.data[0]?.color || getChartColor(chart.type);
      return itemColor !== firstColor;
    });

    switch (chart.type) {
      case "bar":
        if (hasMultipleColors) {
          // Create a data point for each item with its own y-key
          const allData = chart.data.map((item, index) => {
            const dataPoint: any = { x: index, label: item.label };
            chart.data.forEach((_, i) => {
              dataPoint[`y${i}`] = i === index ? item.value : null;
            });
            return dataPoint;
          });

          const yKeys = chart.data.map((_, i) => `y${i}`);

          return (
            <CartesianChart
              data={allData}
              xKey="x"
              yKeys={yKeys}
              domainPadding={{ left: 30, right: 30, top: 30, bottom: 30 }}
            >
              {({ points, chartBounds }) => (
                <>
                  {chart.data.map((item, index) => (
                    <Bar
                      key={`y${index}`}
                      points={points[`y${index}`]}
                      chartBounds={chartBounds}
                      color={item.color || getChartColor("bar")}
                      roundedCorners={{ topLeft: 8, topRight: 8 }}
                    />
                  ))}
                </>
              )}
            </CartesianChart>
          );
        } else {
          // Single color chart
          const data = chart.data.map((item, index) => ({
            x: index,
            y: item.value,
            label: item.label,
          }));

          return (
            <CartesianChart
              data={data}
              xKey="x"
              yKeys={["y"]}
              domainPadding={{ left: 30, right: 30, top: 30, bottom: 30 }}
            >
              {({ points, chartBounds }) => (
                <Bar
                  points={points.y}
                  chartBounds={chartBounds}
                  color={chart.data[0]?.color || getChartColor("bar")}
                  roundedCorners={{ topLeft: 8, topRight: 8 }}
                />
              )}
            </CartesianChart>
          );
        }

      case "line":
        if (hasMultipleColors) {
          // For line charts with multiple colors, create separate line segments
          const allData = chart.data.map((item, index) => {
            const dataPoint: any = { x: index, label: item.label };
            chart.data.forEach((_, i) => {
              dataPoint[`y${i}`] = i === index ? item.value : null;
            });
            return dataPoint;
          });

          const yKeys = chart.data.map((_, i) => `y${i}`);

          return (
            <CartesianChart
              data={allData}
              xKey="x"
              yKeys={yKeys}
              domainPadding={{ left: 30, right: 30, top: 30, bottom: 30 }}
            >
              {({ points }) => (
                <>
                  {chart.data.map((item, index) => (
                    <Line
                      key={`y${index}`}
                      points={points[`y${index}`]}
                      color={item.color || getChartColor("line")}
                      strokeWidth={3}
                      curveType="catmullRom"
                    />
                  ))}
                </>
              )}
            </CartesianChart>
          );
        } else {
          const data = chart.data.map((item, index) => ({
            x: index,
            y: item.value,
            label: item.label,
          }));

          return (
            <CartesianChart
              data={data}
              xKey="x"
              yKeys={["y"]}
              domainPadding={{ left: 30, right: 30, top: 30, bottom: 30 }}
            >
              {({ points }) => (
                <Line
                  points={points.y}
                  color={chart.data[0]?.color || getChartColor("line")}
                  strokeWidth={3}
                  curveType="catmullRom"
                />
              )}
            </CartesianChart>
          );
        }

      case "area":
        if (hasMultipleColors) {
          const allData = chart.data.map((item, index) => {
            const dataPoint: any = { x: index, label: item.label };
            chart.data.forEach((_, i) => {
              dataPoint[`y${i}`] = i === index ? item.value : null;
            });
            return dataPoint;
          });

          const yKeys = chart.data.map((_, i) => `y${i}`);

          return (
            <CartesianChart
              data={allData}
              xKey="x"
              yKeys={yKeys}
              domainPadding={{ left: 30, right: 30, top: 30, bottom: 30 }}
            >
              {({ points, chartBounds }) => (
                <>
                  {chart.data.map((item, index) => (
                    <Area
                      key={`y${index}`}
                      points={points[`y${index}`]}
                      y0={chartBounds.bottom}
                      color={item.color || getChartColor("area")}
                      curveType="catmullRom"
                      animate={{ type: "timing", duration: 300 }}
                    />
                  ))}
                </>
              )}
            </CartesianChart>
          );
        } else {
          const data = chart.data.map((item, index) => ({
            x: index,
            y: item.value,
            label: item.label,
          }));

          return (
            <CartesianChart
              data={data}
              xKey="x"
              yKeys={["y"]}
              domainPadding={{ left: 30, right: 30, top: 30, bottom: 30 }}
            >
              {({ points, chartBounds }) => (
                <Area
                  points={points.y}
                  y0={chartBounds.bottom}
                  color={chart.data[0]?.color || getChartColor("area")}
                  curveType="catmullRom"
                  animate={{ type: "timing", duration: 300 }}
                />
              )}
            </CartesianChart>
          );
        }

      case "pie":
        // For pie charts, we'll use a beautiful visual representation
        const total = chart.data.reduce((sum, item) => sum + item.value, 0);
        const itemWidth = 110; // Fixed width for each item
        const itemsPerRow = Math.floor(chartWidth / itemWidth);
        const horizontalPadding = (chartWidth - (itemsPerRow * itemWidth)) / 2;

        return (
          <View style={{ width: chartWidth, alignSelf: 'center', paddingHorizontal: horizontalPadding }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', alignItems: 'flex-start', paddingVertical: 12 }}>
              {chart.data.map((item, index) => {
                const percentage = ((item.value / total) * 100).toFixed(1);
                const color = item.color || ["#0ea5e9", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"][index % 5];
                return (
                  <View key={index} style={{ alignItems: 'center', marginHorizontal: 6, marginVertical: 8, width: 96 }}>
                    <View
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                        backgroundColor: color,
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                        borderWidth: 4,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Text className="text-white font-bold text-base">
                        {percentage}%
                      </Text>
                    </View>
                    <Text className="text-gray-800 font-semibold text-xs text-center" style={{ width: 96, marginBottom: 4 }} numberOfLines={2} ellipsizeMode="tail">
                      {item.label}
                    </Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: color,
                        backgroundColor: color + '20',
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      {item.value}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={{
        marginBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#7DD3FC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Title */}
      <View className="mb-4">
        <Text className="text-gray-900 font-bold text-lg mb-1">
          {chart.title}
        </Text>
        <View
          className="h-1 w-16 rounded-full"
          style={{ backgroundColor: getChartColor(chart.type) }}
        />
      </View>

      {/* Chart */}
      <View style={{ width: chartWidth, height: chartHeight }}>
        {renderChart()}
      </View>

      {/* Labels */}
      {chart.type !== "pie" && chart.data.length > 0 && (
        <View className="mt-4 flex-row flex-wrap justify-center">
          {chart.data.map((item, index) => (
            <View key={index} className="flex-row items-center mr-4 mb-2">
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor: item.color || getChartColor(chart.type),
                }}
              />
              <Text className="text-gray-600 text-sm">{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Axis Labels */}
      {(chart.xAxisLabel || chart.yAxisLabel) && (
        <View className="mt-2 flex-row justify-between">
          {chart.xAxisLabel && (
            <Text className="text-gray-500 text-xs italic">
              {chart.xAxisLabel}
            </Text>
          )}
          {chart.yAxisLabel && (
            <Text className="text-gray-500 text-xs italic">
              {chart.yAxisLabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

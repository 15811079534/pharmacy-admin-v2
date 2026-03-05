<template>
  <div class="trend-chart">
    <div class="legend">
      <span v-for="item in series" :key="item.name" class="legend-item">
        <i class="legend-dot" :style="{ backgroundColor: item.color }" />
        {{ item.name }}
      </span>
    </div>

    <div class="chart-wrap" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <svg
        ref="svgRef"
        class="chart-svg"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        preserveAspectRatio="none"
      >
        <g class="grid">
          <line
            v-for="line in gridLines"
            :key="line"
            :x1="chartLeft"
            :x2="chartLeft + chartWidth"
            :y1="gridY(line)"
            :y2="gridY(line)"
          />
        </g>

        <g v-for="(item, index) in series" :key="item.name">
          <polyline
            :points="linePoints[index]"
            fill="none"
            :stroke="item.color"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-for="(point, pointIndex) in pointCoords[index]"
            :key="`${item.name}-${pointIndex}`"
            :cx="point.x"
            :cy="point.y"
            r="3.5"
            :fill="item.color"
            stroke="#fff"
            stroke-width="2"
          />
        </g>

        <line
          v-if="hoverIndex >= 0"
          class="cross-line"
          :x1="hoverX"
          :x2="hoverX"
          :y1="chartTop"
          :y2="chartTop + chartHeight"
        />

        <g v-if="hoverIndex >= 0">
          <circle
            v-for="item in hoverDots"
            :key="item.key"
            :cx="item.x"
            :cy="item.y"
            r="5"
            :fill="item.color"
            stroke="#fff"
            stroke-width="2"
          />
        </g>
      </svg>

      <div
        v-if="hoverIndex >= 0"
        class="tooltip"
        :style="{
          left: `${tooltipLeft}px`,
          top: `${tooltipTop}px`
        }"
      >
        <p class="tooltip-title">{{ labels[hoverIndex] }}</p>
        <p v-for="item in tooltipRows" :key="item.name" class="tooltip-row">
          <span class="row-left">
            <i class="legend-dot" :style="{ backgroundColor: item.color }" />
            {{ item.name }}
          </span>
          <strong>{{ item.value }}</strong>
        </p>
      </div>
    </div>

    <div class="x-labels" :style="{ gridTemplateColumns: `repeat(${Math.max(labels.length, 1)}, minmax(0, 1fr))` }">
      <span v-for="label in labels" :key="label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TrendSeries {
  name: string
  color: string
  data: number[]
}

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: TrendSeries[]
    unit?: string
  }>(),
  {
    labels: () => [],
    series: () => [],
    unit: ''
  }
)

const svgRef = ref<SVGSVGElement>()
const hoverIndex = ref(-1)
const tooltipLeft = ref(0)
const tooltipTop = ref(12)

const svgWidth = 680
const svgHeight = 220
const chartLeft = 8
const chartTop = 12
const chartWidth = svgWidth - 16
const chartHeight = 164
const gridLines = 5

const maxValue = computed(() => {
  const values = props.series.flatMap((item) => item.data.map((n) => Number(n) || 0))
  const rawMax = values.length ? Math.max(...values) : 0
  return rawMax > 0 ? rawMax : 1
})

const xStep = computed(() => {
  const size = Math.max(props.labels.length - 1, 1)
  return chartWidth / size
})

const yFor = (value: number) => {
  const ratio = Math.max(0, Math.min(1, value / maxValue.value))
  return chartTop + chartHeight * (1 - ratio)
}

const xFor = (index: number) => chartLeft + xStep.value * index

const linePoints = computed(() =>
  props.series.map((item) =>
    item.data.map((value, index) => `${xFor(index)},${yFor(Number(value) || 0)}`).join(' ')
  )
)

const pointCoords = computed(() =>
  props.series.map((item) =>
    item.data.map((value, index) => ({
      x: xFor(index),
      y: yFor(Number(value) || 0)
    }))
  )
)

const hoverX = computed(() => (hoverIndex.value >= 0 ? xFor(hoverIndex.value) : chartLeft))

const hoverDots = computed(() => {
  if (hoverIndex.value < 0) return []
  return props.series.map((item, index) => ({
    key: `${item.name}-${hoverIndex.value}`,
    x: hoverX.value,
    y: pointCoords.value[index]?.[hoverIndex.value]?.y ?? yFor(0),
    color: item.color
  }))
})

const formatValue = (value: number) => {
  if (props.unit === 'currency') {
    return `¥${value.toFixed(2)}`
  }
  return props.unit ? `${value}${props.unit}` : `${value}`
}

const tooltipRows = computed(() => {
  if (hoverIndex.value < 0) return []
  return props.series.map((item) => ({
    name: item.name,
    color: item.color,
    value: formatValue(Number(item.data[hoverIndex.value] || 0))
  }))
})

const gridY = (lineIndex: number) => {
  const ratio = lineIndex / (gridLines - 1)
  return chartTop + chartHeight * ratio
}

const onMouseMove = (event: MouseEvent) => {
  if (!svgRef.value || !props.labels.length) return

  const rect = svgRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const relative = x / rect.width
  const index = Math.round(relative * (props.labels.length - 1))
  hoverIndex.value = Math.max(0, Math.min(props.labels.length - 1, index))

  const safeX = Math.max(80, Math.min(rect.width - 90, x))
  tooltipLeft.value = safeX
  tooltipTop.value = 10
}

const onMouseLeave = () => {
  hoverIndex.value = -1
}
</script>

<style scoped lang="scss">
.trend-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4e7e92;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-wrap {
  position: relative;
  width: 100%;
  border-radius: 12px;
  border: 1px solid #ddf1f5;
  background: linear-gradient(180deg, #fbfeff, #f6fcfe);
  padding: 8px;
}

.chart-svg {
  width: 100%;
  height: 220px;
  display: block;
}

.grid line {
  stroke: #e7f4f7;
  stroke-width: 1;
}

.cross-line {
  stroke: rgba(21, 94, 117, 0.35);
  stroke-width: 1;
  stroke-dasharray: 4;
}

.tooltip {
  position: absolute;
  transform: translateX(-50%);
  min-width: 136px;
  border-radius: 10px;
  border: 1px solid #d3ebf1;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 20px rgba(9, 73, 92, 0.14);
  padding: 8px 10px;
  pointer-events: none;
}

.tooltip-title {
  font-size: 12px;
  color: #3d7084;
  font-weight: 700;
  margin-bottom: 6px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #4f8093;
  line-height: 1.55;

  strong {
    color: #174f64;
    font-size: 12px;
  }
}

.row-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.x-labels {
  display: grid;
  gap: 6px;

  span {
    text-align: center;
    font-size: 12px;
    color: #7ea5b4;
  }
}

@media (max-width: 768px) {
  .chart-svg {
    height: 188px;
  }
}
</style>

<template>
  <section class="page-hero">
    <div class="hero-main">
      <p class="hero-kicker">模块工作台</p>
      <h2>{{ title }}</h2>
      <p class="hero-description">{{ description }}</p>
    </div>

    <div class="hero-stats">
      <article
        v-for="item in stats"
        :key="item.label"
        class="stat-card"
        :class="item.tone || 'primary'"
      >
        <p class="stat-label">{{ item.label }}</p>
        <p class="stat-value">{{ item.value }}</p>
        <p v-if="item.helper" class="stat-helper">{{ item.helper }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface HeroStat {
  label: string
  value: string | number
  helper?: string
  tone?: string
}

defineProps<{
  title: string
  description: string
  stats: HeroStat[]
}>()
</script>

<style scoped lang="scss">
.page-hero {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid #cbeaf0;
  background:
    radial-gradient(circle at 12% -22%, rgba(34, 211, 238, 0.2), transparent 38%),
    linear-gradient(135deg, #f7feff, #eff9fc 48%, #ecf8fb);
  box-shadow: 0 12px 28px rgba(6, 116, 145, 0.1);
}

.hero-main {
  max-width: 440px;
}

.hero-kicker {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #bde4ea;
  background: #f5feff;
  color: #1d7288;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.hero-main h2 {
  margin-top: 8px;
  color: #14526a;
  font-size: 24px;
  font-weight: 800;
}

.hero-description {
  margin-top: 8px;
  color: #5d8ca0;
  line-height: 1.7;
  font-size: 14px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  min-width: min(540px, 62%);
}

.stat-card {
  border-radius: 14px;
  border: 1px solid #d4ebf1;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.8);
}

.stat-label {
  color: #6896a8;
  font-size: 12px;
  font-weight: 600;
}

.stat-value {
  margin-top: 4px;
  color: #154f64;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
}

.stat-helper {
  margin-top: 2px;
  color: #7da5b4;
  font-size: 12px;
}

.stat-card.primary {
  box-shadow: inset 0 0 0 1px rgba(8, 145, 178, 0.08);
}

.stat-card.success {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.24);
}

.stat-card.warning {
  background: rgba(249, 115, 22, 0.09);
  border-color: rgba(249, 115, 22, 0.24);
}

.stat-card.danger {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.24);
}

.stat-card.info {
  background: rgba(14, 165, 233, 0.08);
  border-color: rgba(14, 165, 233, 0.24);
}

@media (max-width: 1200px) {
  .page-hero {
    flex-direction: column;
  }

  .hero-stats {
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .page-hero {
    padding: 14px;
  }

  .hero-main h2 {
    font-size: 20px;
  }

  .hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>

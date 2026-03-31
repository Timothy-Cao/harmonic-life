// src/canvas/particles.ts
export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
  type: 'birth' | 'death'
}

export class ParticleSystem {
  particles: Particle[] = []

  emit(x: number, y: number, hue: number, type: 'birth' | 'death') {
    const count = type === 'birth' ? 6 : 4
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 0.5 + Math.random() * 1.5
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 20 + Math.random() * 20,
        hue,
        type,
      })
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.96
      p.vy *= 0.96
      p.life -= 1 / p.maxLife
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life * 0.6
      const size = p.type === 'birth' ? 2 + p.life * 2 : 1 + p.life
      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

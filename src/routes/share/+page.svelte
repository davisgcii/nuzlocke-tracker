<script>
  import { onMount } from 'svelte'
  import { decompress } from '$lib/utils/codec'
  import { createImgUrl } from '$utils/rewrites'
  import { Expanded as Games } from '$lib/data/games.js'
  import defaultColors from '$lib/data/colors'

  let shareData = null
  let error = false

  const groupLabel = {
    'gym-leader': 'Gym Leader',
    'elite-four': 'Elite Four',
    rival: 'Rival',
    'evil-team': 'Evil Team',
    'mini-boss': 'Boss'
  }

  const spriteUrl = (pokemon) =>
    createImgUrl({ sprite: pokemon }, { ext: 'png' })

  const typeColor = (type) =>
    defaultColors[type?.toLowerCase()] || defaultColors.normal

  onMount(async () => {
    const hash = window.location.hash.slice(1)
    if (!hash) {
      error = true
      return
    }
    try {
      shareData = await decompress(hash)
    } catch {
      error = true
    }
  })

  $: game = shareData ? Games[shareData.meta.game] : null
</script>

<svelte:head>
  <title>
    {shareData ? `${shareData.meta.name} · Nuzlocke Tracker` : 'Nuzlocke Tracker'}
  </title>
  <meta name="robots" content="nofollow, noindex" />
</svelte:head>

<div class="min-h-screen bg-gray-900 text-gray-100 font-sans">
  <div class="mx-auto max-w-lg px-4 py-10">

    {#if error}
      <div class="flex flex-col items-center gap-4 pt-24 text-center">
        <p class="text-2xl font-bold text-yellow-400">Invalid share link</p>
        <a href="/" class="text-sm text-gray-400 underline">Go to nuzlocke.app</a>
      </div>

    {:else if !shareData}
      <div class="flex items-center justify-center pt-24">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-yellow-400" />
      </div>

    {:else}
      {@const { meta, team, dead, beaten } = shareData}

      <!-- Header -->
      <div class="mb-8 flex items-center gap-4">
        {#if game?.logo}
          <img
            src="/assets/{meta.game}"
            alt="{game.title} logo"
            class="h-12 w-24 object-contain"
          />
        {/if}
        <div>
          <h1 class="text-2xl font-bold leading-tight text-gray-50">
            {meta.name}
            {#if meta.attempts > 1}
              <span class="ml-1 text-sm font-normal italic text-gray-400">
                (Attempt {meta.attempts})
              </span>
            {/if}
          </h1>
          {#if game}
            <p class="text-sm text-gray-400">{game.title}</p>
          {/if}
        </div>
      </div>

      <!-- Party -->
      {#if team.length}
        <section class="mb-6">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-yellow-400">
            Party
          </h2>
          <div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {#each team as member}
              <div class="flex flex-col items-center gap-1">
                <div class="relative h-16 w-16 rounded-lg bg-gray-800">
                  <img
                    src={spriteUrl(member.pokemon)}
                    alt={member.nickname || member.pokemon}
                    class="h-full w-full object-contain"
                  />
                </div>
                <span class="max-w-[4rem] truncate text-center text-xs text-gray-300">
                  {member.nickname || member.pokemon}
                </span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Fallen -->
      {#if dead.length}
        <section class="mb-6">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-red-400">
            Fallen
            <span class="ml-1 font-normal text-gray-500">({dead.length})</span>
          </h2>
          <div class="flex flex-wrap gap-2">
            {#each dead as fallen}
              <div class="flex flex-col items-center gap-0.5">
                <div class="relative h-12 w-12 rounded-lg bg-gray-800 opacity-60 grayscale">
                  <img
                    src={spriteUrl(fallen.pokemon)}
                    alt={fallen.nickname || fallen.pokemon}
                    class="h-full w-full object-contain"
                  />
                </div>
                <span class="max-w-[3rem] truncate text-center text-xs text-gray-500">
                  {fallen.nickname || fallen.pokemon}
                </span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Bosses cleared -->
      {#if beaten.length}
        <section class="mb-8">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-widest text-green-400">
            Bosses Cleared
            <span class="ml-1 font-normal text-gray-500">({beaten.length})</span>
          </h2>
          <div class="flex flex-col gap-2">
            {#each beaten as boss}
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500 w-20 shrink-0">
                  {groupLabel[boss.group] || 'Boss'}
                </span>
                <span class="text-sm font-medium text-gray-200">{boss.name}</span>
                {#if boss.type}
                  <span
                    class="ml-auto rounded px-2 py-0.5 text-xs font-bold text-white capitalize"
                    style="background-color: {typeColor(boss.type)}"
                  >
                    {boss.type}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Footer -->
      <div class="border-t border-gray-800 pt-4 text-center text-xs text-gray-600">
        nuzlocke.app
      </div>
    {/if}

  </div>
</div>

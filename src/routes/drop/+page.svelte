<script>
  import { onMount } from 'svelte'
  import { decompress } from '$lib/utils/codec'
  import { updateGame, savedGames, IDS } from '$lib/store'
  import { Loader } from '$c/core'

  let error = false

  onMount(async () => {
    const hash = window.location.hash.slice(1)

    if (!hash) {
      window.location = '/saves'
      return
    }

    try {
      const { save, data } = await decompress(hash)
      window.localStorage.setItem(IDS.game(save.id), JSON.stringify(data))
      savedGames.update(updateGame(save))
      window.location = '/saves'
    } catch (e) {
      error = true
    }
  })
</script>

<svelte:head>
  <meta name="robots" content="nofollow, noindex" />
</svelte:head>

{#if error}
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 dark:text-gray-200">
    <p class="text-xl font-bold">Invalid backup link</p>
    <a href="/saves" class="text-sm underline">Go to saves</a>
  </div>
{:else}
  <Loader />
{/if}

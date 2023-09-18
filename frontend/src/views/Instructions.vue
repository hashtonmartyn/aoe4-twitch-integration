<template>
  <Card class="mb-2">
    <template #title>
      Twitch
    </template>
    <template #content>
      <ol type="1">
        <li>Create a twitch account if you haven't already got one</li>
        <li>Become a twitch affiliate or twitch partner, you cannot create polls in twitch chat otherwise</li>
        <li>Click the <a href="/ConnectWithTwitch">Connect With Twitch</a> button at the top of the page</li>
        <li>Accept the terms of service</li>
        <li>Authorise AoE4-Integration to manage your channel's polls</li>
      </ol>
    </template>
  </Card>

  <Card class="mb-2">
    <template #title>
      Powershell Script
    </template>
    <template #content>
      <ol type="1">
        <li>
          Create a folder called <code>aoe4ti</code> in your <code>C:\</code> drive i.e. <code>C:\aoe4ti</code>
        </li>
        <li>
          Download <a href="https://github.com/hashtonmartyn/aoe4-twitch-integration/blob/main/getCommand.ps1">this powershell script</a> and save it into <code>C:\aoe4ti</code>
        </li>
        <li>This script might look scary but all it does is check for poll results and save them into a file at <code>C:\aoe4ti\poll_result.scar</code> which the mod will then read from</li>
        <li>If you're really worried about that script copy the contents and paste them into chatgpt, ask chatgpt what it does</li>
        <li>Open powershell, enter <code>cd C:\aoe4ti</code> then hit enter</li>
        <li>Enter <code>powershell -ExecutionPolicy Bypass -File .\getCommand.ps1 HeneroAOE</code> but replace <code>HeneroAOE</code> with your twitch username. If your twitch username has capital letters make sure you capitalise correctly</li>
        <li>You should see something like this: <code>Get https://backend.aoe4ti.com/poll_result/HeneroAOE</code> followed by some errors. Don't worry about the errors, they will disappear once a poll has concluded</li>
      </ol>
    </template>
  </Card>
  <Card class="mb-2">
    <template #title>
      Mod
    </template>
    <template #content>
      <ol type="1">
        <li>Open AoE4 and search for <code>Twitch Integration</code> in the mod browser, ensure that the author is <code>Henero</code></li>
        <li>Create a custom game and change the mode to <code>Twitch Integration</code></li>
        <li>Make sure you choose blue as your colour, this is critical. The mod expects that the blue player is the one running the powershell script</li>
        <li>Invite people to your game</li>
        <li>Ensure that each player has picked a colour</li>
      </ol>
    </template>
  </Card>
  <Card class="mb-2">
    <template #title>
      Poll Management
    </template>
    <template #content>
      <ol type="1">
        <li>Set the number of players to match your in-game lobby</li>
        <li>Set the player's colours to match the lobby</li>
        <li>Set the poll duration and time between polls as desired</li>
        <li>Click the <code>Start Automatic Polls</code> button</li>
        <li>Start the game!</li>
      </ol>
    </template>
  </Card>
</template>

<script async lang="ts" setup>
import Card from "primevue/card";

</script>
<style>
code {
  font-family: Consolas,"courier new";
  color: darkgrey;
  //background-color: #f1f1f1;
  padding: 2px;
  font-size: 105%;
}
</style>
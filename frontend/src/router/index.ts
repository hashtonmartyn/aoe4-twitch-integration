import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TwitchAuth from "../views/TwitchAuth.vue";
import PollManagement from "../views/PollManagement.vue";
import TestUser from "@/views/TestUser.vue";
import ConnectWithTwitch from "@/views/ConnectWithTwitch.vue";
import Instructions from "@/views/Instructions.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/ConnectWithTwitch',
      name: 'ConnectWithTwitch',
      component: ConnectWithTwitch
    },
    {
      path: '/TwitchAuth',
      name: 'TwitchAuth',
      component: TwitchAuth
    },
    {
      path: '/PollManagement',
      name: 'PollManagement',
      component: PollManagement
    },
    {
      path: '/TestUser',
      name: 'TestUser',
      component: TestUser
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/Instructions',
      name: 'Instructions',
      component: Instructions
    }
  ]
})

export default router

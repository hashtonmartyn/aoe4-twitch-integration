<template>
  <div class="flex flex-column ">
    <div class="flex align-items-center justify-content-center">
      <div class="overflow-auto lg:h-30rem lg:w-10">
        <h1>Welcome to aoe4ti.com!</h1>

        By using our services, you agree to comply with and be bound by the following terms and conditions of use. Please read these terms carefully before using our website and services.

        <h2>1. Acceptance of Terms</h2>

        By accessing or using aoe4ti.com ("the Website" or "Our Services"), you agree to comply with and be bound by these Terms of Service. If you do not agree with these terms, please do not use our services.

        <h2>2. User Eligibility</h2>

        You must be at least 18 years old or have parental/guardian consent to use our services. If you are under 18, please obtain permission from a parent or legal guardian.

        <h2>3. Registration</h2>

        To use certain features of the Website, you may be required to create an account and provide accurate, current, and complete information during the registration process. You are responsible for maintaining the confidentiality of your account information and are solely responsible for all activities that occur under your account.

        <h2>4. Twitch Integration</h2>

        Our website allows users to connect their Twitch accounts and control polls in their Twitch streams. By using this feature, you agree to abide by Twitch's terms of service, and you acknowledge that we are not responsible for any actions taken by Twitch in relation to your account or streams.

        <h2>5. User Content</h2>

        You are solely responsible for any content you submit or display on the Website. You agree not to post, transmit, or share content that is illegal, defamatory, harassing, harmful, or violates the rights of others.

        <h2>6. Prohibited Activities</h2>

        You may not engage in any activities on our Website that could harm, disrupt, or interfere with the proper functioning of the Website or the experience of other users. This includes but is not limited to spamming, hacking, or any other malicious activity.

        <h2>7. Intellectual Property</h2>

        All content and materials on the Website, including text, graphics, logos, and software, are the property of aoe4ti.com and are protected by copyright and other intellectual property laws. You may not use our content without our express written permission.

        <h2>8. Termination of Service</h2>

        We reserve the right to terminate or suspend your account and access to our services at our discretion, without prior notice, if you violate these Terms of Service.

        <h2>9. Disclaimer of Warranties</h2>

        Our services are provided "as is" and "as available." We make no warranties or representations about the accuracy, reliability, or availability of our services.

        <h2>10. Limitation of Liability</h2>

        We are not liable for any damages, including but not limited to, direct, indirect, incidental, consequential, or punitive damages, arising out of your use or inability to use our services.

        <h2>11. Changes to Terms</h2>

        We may update these Terms of Service at any time. It is your responsibility to review these terms periodically for changes.

        <h2>12. Contact Information</h2>

        If you have any questions or concerns about these Terms of Service, please contact henero on discord.

        By using aoe4ti.com, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
      </div>
    </div>

    <div class="flex align-items-center justify-content-center m-4">
      <Checkbox v-model="termsAccepted" :binary="true" name="termsAccepted" id="termsAccepted"  />
      <label class="ml-2" for="termsAccepted">I accept the terms of service</label>
    </div>
    <div class="flex align-items-center justify-content-center">
      <Button label="Connect with Twitch" :disabled="!termsAccepted" @click="connectWithTwitch"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref} from "vue";


const termsAccepted = ref(false)
import config from "../config";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";


function connectWithTwitch() {
  window.location.href = `${config.backendApiBaseUri}login/twitch`
}

</script>
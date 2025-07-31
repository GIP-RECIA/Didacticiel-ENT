/**
 * Copyright (C) 2025 GIP-RECIA, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { JWT } from '@uportal/open-id-connect'
import type { Alignment, AllowedButtons, Config, Driver, DriveStep, Side, State } from 'driver.js'
import { driver } from 'driver.js'
import { querySelectorDeep } from 'query-selector-shadow-dom'
import { getToken } from './services/soffitUtils'
import 'driver.js/dist/driver.css'
import './style/css/global.css'
import 'regenerator-runtime'

declare global {
  interface WindowEventMap {
    'eyebrow-user-info': CustomEvent
  }
}

let interceptEventOnPageExceptPopover: EventListenerOrEventListenerObject | undefined
let interceptEventOnPopover: EventListenerOrEventListenerObject | undefined
let clickAllowList: string | undefined
const classMarkedPopover = 'marked-popover'
const selectorMarkedPopover = `.${classMarkedPopover}`
const selectorDriverPopover = '.driver-popover'
type BreakpointsKeys = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
let previousHtmlOveflowValue: string
let html: HTMLElement | undefined

let currentDrive: Driver | undefined
let tourConfig: Config | undefined
let steps: Array<StepFromJson> | undefined
let isProcessingClic: boolean = false
let getUserTourUri: string
let setUserTourUri: string

let pretourStep: StepFromJson | undefined
let pretourConfig: Config | undefined

const completeKey: string = 'COMPLETED'
const deniedKey: string = 'DENIED'

function prepareEvents() {
  interceptEventOnPageExceptPopover = (e) => {
    if (e.type === 'keyup') {
      const ke = e as KeyboardEvent
      if (ke.key === 'Enter') {
        const popover = document.querySelector('.driver-popover')
        // keyup Enter -> emit par la nouvelle modale, car le keydown a provoqué le changement de modal, la nouvelle modale n'a pas encore
        // posé ses event listener pour intercepter l'event, dans ce cas précis on va l'intercepter dans cette callback
        if (popover === null || !popover.classList.contains(classMarkedPopover)) {
          // le check de classList permet de savoir si les listeners ont été posé ou non
          e.stopPropagation()
          e.preventDefault()
        }
      }
    }

    const target = e.target as HTMLElement
    const isInsideDriverPopover = target.closest(selectorDriverPopover) !== null

    let foundTargetInChild = false
    if (clickAllowList && e.type === 'click') {
      foundTargetInChild = querySelectorDeep(clickAllowList, target) !== null
    }

    if (!isInsideDriverPopover && !foundTargetInChild) {
      // on ne bloque que les clics et keyups qui ont eu dehors de la modale et que s'ils ne sont pas sur un élément de la allowList
      // la allowList existe car on veut laisser passer des clics lors des onNextClick et des onPreviousClick
      e.stopPropagation()
      e.preventDefault()
    }
  }

  interceptEventOnPopover = (e) => {
    e.stopPropagation()
    e.preventDefault()
  }
}

prepareEvents()

function enableClickInterception() {
  html = document.querySelector('html')!
  previousHtmlOveflowValue = html.style.overflow
  html.style.overflow = 'hidden'

  if (interceptEventOnPageExceptPopover !== undefined) {
    ['click', 'keyup'].forEach(evt => window.addEventListener(evt, interceptEventOnPageExceptPopover!, { capture: true, once: false }))
  }
  enableClickInterceptionPopover()
}

async function enableClickInterceptionPopover() {
  await waitForElement('.driver-popover', 5000, selectorMarkedPopover)
  const popover = document.querySelector('.driver-popover')
  if (popover && interceptEventOnPopover) {
    ['click', 'keyup'].forEach(evt => popover.addEventListener(evt, interceptEventOnPopover!, { capture: false, once: false }))

    // popover.addEventListener('click', interceptEventOnPopover, { capture: false, once: false })
    popover.classList.add(classMarkedPopover)

    const btns = document.querySelectorAll('.driver-popover-navigation-btns button')
    btns.forEach((elem) => {
      elem.addEventListener('click', () => {
        // e.stopPropagation()
        // e.preventDefault()
      }, { capture: true, once: false })
    })

    btns.forEach((elem) => {
      elem.addEventListener('keyup', (e) => {
        if (e.key !== 'Tab')
          e.stopPropagation()
        // e.preventDefault()
      }, { capture: true, once: false })
    })
  }
}

function disableClickInterception() {
  if (interceptEventOnPageExceptPopover) {
    ['click', 'keyup'].forEach(evt => window.removeEventListener(evt, interceptEventOnPageExceptPopover!, true))
  }

  const popover = document.querySelector('.driver-popover')

  if (popover && interceptEventOnPopover) {
    popover.removeEventListener('click', interceptEventOnPopover)
  }
}

const breakpoints: Map<BreakpointsKeys, number> = new Map([
  ['xs', 0],
  ['sm', 576],
  ['md', 768],
  ['lg', 992],
  ['xl', 1200],
  ['xxl', 1400],
])

function _getIcon(icon: string): string {
  return `<i id="r-driver-icon" class="${icon}"></i>`
}

function getBtnClose(): string {
  return '<button id="r-close" src="https://placehold.co/20"><svg class="fontawesome" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg></button>'
}
function getTitle(title: string, tourConfig?: Config): string {
  return `<div class="toRight">${tourConfig?.allowClose ? getBtnClose() : ''}</div><h2>${title}</h2>`
}

function getRenderLambda() {
  return () => {
    const btn = window.document.getElementById('r-close') as HTMLElement
    if (tourConfig?.allowClose && btn) {
      btn.addEventListener('click', () => {
        currentDrive?.destroy()
      })
    }
    else if (btn) {
      btn.style.visibility = 'hidden'
    }
  }
}

interface StepFromJson {
  title: string
  description: string
  element: string
  icon?: string
  showButtons?: AllowedButtons[]
  side?: Side
  sideMobile?: Side
  align?: Alignment
  alignMobile?: Alignment
  clickOnNextCssSelector?: string
  clickOnPrevCssSelector?: string
}

interface UserTour {
  tutorial: Array<string>
}

async function getUserTourComplete() {
  const url = getUserTourUri
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const json: UserTour = await response.json()
    return json
  }
  catch (error: any) {
    console.error(error.message)
  }
}

function onEndOfTour() {
  disableClickInterception() // restore event propagation
  html!.style.overflow = previousHtmlOveflowValue! // restore scroll
  setUserTourComplete()
}

async function setUserTourComplete() {
  const url = setUserTourUri
  const map = new Map<string, boolean>()
  map.set(completeKey, true)
  const userTour: UserTour = { tutorial: [completeKey] }
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(userTour),
    })
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }
  }
  catch (error: any) {
    console.error(error.message)
  }
}

async function setUserTourDenied() {
  const url = setUserTourUri
  const map = new Map<string, boolean>()
  map.set(completeKey, true)
  const userTour: UserTour = { tutorial: [deniedKey] }
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(userTour),
    })
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }
  }
  catch (error: any) {
    console.error(error.message)
  }
}

function getProperty(property: string): string | undefined {
  return document.querySelector('script#didacticiel-ent')?.getAttribute(property) ?? undefined
}

async function init(): Promise<void> {
  let confUri: string | undefined = getProperty('confUri')
  if (confUri === undefined) {
    console.error('No configuration URI for tutorial')
    return
  }

  getUserTourUri = getProperty('getUserTourUri') ?? ''
  setUserTourUri = getProperty('setUserTourUri') ?? ''

  confUri = import.meta.env.VITE_BASE_URI + confUri
  const configurationValue:
    | { tourConfig: Config, stepsConfig: StepFromJson[], pretourStepConfig: StepFromJson, pretourConfig: Config, pretourCustomConfig: any }
    | undefined = await getConfJson(confUri)

  if (configurationValue === undefined) {
    console.error('No configuration for tutorial')
    return
  }

  tourConfig = configurationValue.tourConfig
  steps = configurationValue.stepsConfig
  pretourStep = configurationValue.pretourStepConfig
  pretourConfig = configurationValue.pretourConfig

  const askEachTimeUntilCompleted = configurationValue.pretourCustomConfig.askEachTimeUntilCompleted

  // create  event to relaunch tutorial only here, because there is no point to register if conf is missing
  document.addEventListener('eyebrow-user-info', startTutorial)

  // WIP: for now the tutorial open each time
  const userTutorialData: UserTour | undefined = await getUserTourComplete()
  if (userTutorialData?.tutorial?.includes(completeKey)) {
    // return
  }
  if (userTutorialData?.tutorial?.includes(deniedKey) && !askEachTimeUntilCompleted) {
    return
  }

  // for test only, to no display tutorial to everyone when they open the portal page

  const token: { encoded: string, decoded: JWT } = await getToken(
    import.meta.env.VITE_USER_TOKEN_URI,
  )
  const allowedUsers: Array<string> = import.meta.env.VITE_ALLOWED_TEST_USERS.split(';')

  if (allowedUsers.includes(token.decoded.sub)) {
    askForTutorial()
  }
}

async function askForTutorial() {
  if (pretourConfig === undefined || pretourStep === undefined) {
    console.error('Incorrect configuration for tutorial')
    return
  }
  pretourConfig.steps = []
  pretourConfig.steps.push(preTourCreateStep(pretourStep))
  pretourConfig.steps.push(preTourCreateStep(pretourStep))
  pretourConfig.smoothScroll = true
  pretourConfig.disableActiveInteraction = true
  pretourConfig.allowKeyboardControl = false

  const driverObjTour = driver(pretourConfig)
  currentDrive = driverObjTour
  driverObjTour.drive(1)
  await waitForElement(selectorDriverPopover)
  enableClickInterception()
}

async function startTutorial(evt?: Event): Promise<void> {
  if (evt) {
    const cevt = evt as CustomEvent
    if (cevt.detail.type !== 'starter') {
      return
    }
  }
  if (currentDrive?.isActive()) {
    return
  }

  if (tourConfig === undefined || steps === undefined || steps.length === 0) {
    console.error('Incorrect configuration for tutorial')
    return
  }
  tourConfig.steps = []

  for (let index = 0; index < steps.length; index++) {
    // const nextStep = index === steps.length - 1 ? undefined : steps[index + 1]
    tourConfig.steps.push(createStep(steps[index], steps[index + 1], steps[index - 1], tourConfig))
  }
  tourConfig.smoothScroll = true
  tourConfig.disableActiveInteraction = true
  tourConfig.allowKeyboardControl = false
  tourConfig.onDestroyed = () => {
    disableClickInterception()
  }
  const driverObjTour = driver(tourConfig)
  currentDrive = driverObjTour
  driverObjTour.drive()
  await waitForElement(selectorDriverPopover)
  enableClickInterception()
}

function preTourCreateStep(stepFromJson: StepFromJson): DriveStep {
  return {
    element: undefined,
    popover: {
      showButtons: stepFromJson.showButtons,
      title: stepFromJson.title,
      description: stepFromJson.description,
      onNextClick: async () => {
        currentDrive?.destroy()
        disableClickInterception()
        startTutorial()
      },
      onPrevClick: async () => {
        currentDrive?.destroy()
        setUserTourDenied()
        disableClickInterception()
      },
    },
  }
}

function createStep(stepFromJson: StepFromJson, nextStep: StepFromJson | undefined, previousStep: StepFromJson | undefined, tourConfig: Config | undefined): DriveStep {
  const isMobile = window.innerWidth < breakpoints.get('lg')! // if < lg
  let elementToClickOnNext: HTMLElement | undefined
  if (stepFromJson.clickOnNextCssSelector !== undefined) {
    try {
      elementToClickOnNext = querySelectorDeep(
        `${stepFromJson.clickOnNextCssSelector}`,
      ) as HTMLElement
    }
    catch {
      elementToClickOnNext = undefined
    }
  }

  let elementToClickOnPrev: HTMLElement | undefined

  if (stepFromJson.clickOnPrevCssSelector !== undefined) {
    try {
      elementToClickOnPrev = querySelectorDeep(
        `${stepFromJson.clickOnPrevCssSelector}`,
      ) as HTMLElement
    }
    catch {
      elementToClickOnPrev = undefined
    }
  }
  return {
    element: querySelectorDeep(stepFromJson.element) ?? undefined,

    popover: {
      showButtons: stepFromJson.showButtons,
      title: getTitle(stepFromJson.title, tourConfig),
      description: stepFromJson.description,
      side: isMobile ? stepFromJson.sideMobile : stepFromJson.side,
      align: isMobile ? stepFromJson.alignMobile : stepFromJson.align,

      onNextClick: async (
        element?: Element,
        step: DriveStep,
        options: { config: Config, state: State, driver: Driver },
      ) => {
        // prevent fast multi click to affect behavior
        // this is used only in onNextClick and onPrevClick
        if (isProcessingClic) {
          return
        }
        isProcessingClic = true

        if (elementToClickOnNext) {
          await waitForElement(stepFromJson!.clickOnNextCssSelector!)
          // add the target element to be clicked then remove it just after
          clickAllowList = stepFromJson!.clickOnNextCssSelector!
          elementToClickOnNext.click()
          clickAllowList = undefined
        }
        if (!options.driver.hasNextStep()) {
          onEndOfTour()
          currentDrive?.moveNext()
        }

        if (nextStep) {
          // before going to next step that will target visualy the next element, make sure it's available
          await waitForElement(nextStep.element)
          currentDrive?.moveNext()
          // place listener on the new popover
          await enableClickInterceptionPopover()
        }

        // re enable click
        isProcessingClic = false
      },
      onPrevClick: async (
        element?: Element,
        step: DriveStep,
        options: { config: Config, state: State, driver: Driver },
      ) => {
        // should not happen
        if (!options.driver.hasPreviousStep) {
          return
        }

        // prevent fast multi click to affect behavior
        // this is used only in onNextClick and onPrevClick
        if (isProcessingClic) {
          return
        }
        isProcessingClic = true
        if (elementToClickOnPrev) {
          await waitForElement(stepFromJson!.clickOnPrevCssSelector!)
          // add the target element to be clicked then remove it just after
          clickAllowList = stepFromJson!.clickOnPrevCssSelector!
          elementToClickOnPrev.click()
          clickAllowList = undefined
        }

        if (previousStep) {
          // before going to previous step that will target visualy the previous element, make sure it's available
          await waitForElement(previousStep.element)
          currentDrive?.movePrevious()
          // place listener on the new popover
          enableClickInterceptionPopover()
        }
        isProcessingClic = false
      },
      onPopoverRender: getRenderLambda(),
    },
  }
}

function waitForElement(selector: string, timeout = 3000, negativeSelector?: string) {
  // negative selector is used when waiting for the previous popover to be destoyed, and the new one to be created,
  // the new one will be lacking a class, so negative selector allow us to know its the new one we're finding
  return new Promise((resolve, reject) => {
    const intervalTime = 50
    let timePassed = 0
    const interval = setInterval(() => {
      const element = querySelectorDeep(selector)
      if (element && element.offsetParent !== null && negativeSelector ? !element.matches(negativeSelector) : true) {
        clearInterval(interval)
        resolve(element)
      }
      else if (timePassed >= timeout) {
        clearInterval(interval)
        reject(new Error(`Element not found in time: ${selector}`))
      }

      timePassed += intervalTime
    }, intervalTime)
  })
}

async function getConfJson(
  url: string,
): Promise<{ tourConfig: Config, stepsConfig: StepFromJson[] } | undefined> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const json = await response.json()

    const values: { tourConfig: Config, stepsConfig: StepFromJson[] } = json
    return values
  }
  catch (error: any) {
    console.error(error.message)
  }
}

// wait for dom to be loaded before invoking callback
function onDOMContentLoaded(callback: (() => void) | (() => Promise<void>)): void {
  // if DOM is still loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback)
  }
  // if DOM is already loaded
  else {
    callback()
  }
}

onDOMContentLoaded(init)

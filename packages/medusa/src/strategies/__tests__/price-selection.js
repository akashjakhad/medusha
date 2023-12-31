import { FlagRouter } from "@medusajs/utils"
import PriceSelectionStrategy from "../price-selection"
import { cacheServiceMock } from "../../services/__mocks__/cache"
import TaxInclusivePricingFeatureFlag from "../../loaders/feature-flags/tax-inclusive-pricing"

const executeTest =
  (flagValue) =>
  async (title, { variant_id, context, validate, validateException }) => {
    const mockMoneyAmountRepository = {
      findManyForVariantsInRegion: jest
        .fn()
        .mockImplementation(
          async (
            [variant_id],
            region_id,
            currency_code,
            customer_id,
            useDiscountPrices
          ) => {
            if (variant_id === "test-basic-variant") {
              return [
                {
                  [variant_id]: [
                    {
                      amount: 100,
                      region_id,
                      currency_code,
                      price_list_id: null,
                      max_quantity: null,
                      min_quantity: null,
                    },
                  ],
                },
                1,
              ]
            }
            if (variant_id === "test-basic-variant-tax-inclusive") {
              return [
                {
                  [variant_id]: [
                    {
                      amount: 100,
                      region_id,
                      price_list_id: null,
                      max_quantity: null,
                      min_quantity: null,
                      region: {
                        includes_tax: true,
                      },
                    },
                    {
                      amount: 120,
                      currency_code,
                      price_list_id: null,
                      max_quantity: null,
                      min_quantity: null,
                      currency: {
                        includes_tax: true,
                      },
                    },
                  ],
                },
                1,
              ]
            }

            if (variant_id === "test-basic-variant-tax-inclusive-currency") {
              return [
                {
                  [variant_id]: [
                    {
                      amount: 100,
                      region_id,
                      max_quantity: null,
                      min_quantity: null,
                      price_list_id: null,
                    },
                    {
                      amount: 100,
                      currency_code,
                      price_list_id: null,
                      max_quantity: null,
                      min_quantity: null,
                      currency: {
                        includes_tax: true,
                      },
                    },
                  ],
                },
                1,
              ]
            }

            if (variant_id === "test-basic-variant-tax-inclusive-region") {
              return [
                {
                  [variant_id]: [
                    {
                      amount: 100,
                      region_id,
                      max_quantity: null,
                      min_quantity: null,
                      price_list_id: null,
                      region: {
                        includes_tax: true,
                      },
                    },
                    {
                      amount: 100,
                      currency_code,
                      price_list_id: null,
                      max_quantity: null,
                      min_quantity: null,
                    },
                  ],
                },
                1,
              ]
            }

            if (variant_id === "test-basic-variant-mixed") {
              return [
                {
                  [variant_id]: [
                    {
                      amount: 100,
                      region_id,
                      max_quantity: null,
                      min_quantity: null,
                      price_list_id: null,
                      region: {
                        includes_tax: false,
                      },
                    },
                    {
                      amount: 95,
                      currency_code,
                      price_list_id: "pl_1",
                      max_quantity: null,
                      min_quantity: null,
                      price_list: { type: "sale" },
                    },
                    {
                      amount: 110,
                      currency_code,
                      price_list_id: "pl_2",
                      max_quantity: null,
                      min_quantity: null,
                      price_list: { type: "sale", includes_tax: true },
                    },
                    {
                      amount: 150,
                      currency_code,
                      price_list_id: "pl_3",
                      max_quantity: null,
                      min_quantity: null,
                      price_list: { type: "sale" },
                    },
                  ],
                },
                1,
              ]
            }

            if (customer_id === "test-customer-1") {
              return [
                {
                  [variant_id]: [
                    {
                      amount: 100,
                      region_id,
                      currency_code,
                      price_list_id: null,
                      max_quantity: null,
                      min_quantity: null,
                    },
                    {
                      amount: 50,
                      region_id: region_id,
                      currency_code: currency_code,
                      price_list: { type: "sale" },
                      max_quantity: null,
                      min_quantity: null,
                    },
                  ],
                },
                2,
              ]
            }
            if (customer_id === "test-customer-2") {
              return [
                {
                  [variant_id]: [
                    {
                      amount: 100,
                      region_id,
                      currency_code,
                      price_list_id: null,
                      max_quantity: null,
                      min_quantity: null,
                    },
                    {
                      amount: 30,
                      min_quantity: 10,
                      max_quantity: 12,
                      price_list: { type: "sale" },
                      region_id: region_id,
                      currency_code: currency_code,
                    },
                    {
                      amount: 20,
                      min_quantity: 3,
                      max_quantity: 5,
                      price_list: { type: "sale" },
                      region_id: region_id,
                      currency_code: currency_code,
                    },
                    {
                      amount: 50,
                      min_quantity: 5,
                      max_quantity: 10,
                      price_list: { type: "sale" },
                      region_id: region_id,
                      currency_code: currency_code,
                    },
                  ],
                },
                4,
              ]
            }

            return []
          }
        ),
    }

    const mockEntityManager = {
      withRepository: (repotype) => mockMoneyAmountRepository,
    }

    const featureFlagRouter = new FlagRouter({
      tax_inclusive_pricing: flagValue,
    })

    const selectionStrategy = new PriceSelectionStrategy({
      manager: mockEntityManager,
      moneyAmountRepository: mockMoneyAmountRepository,
      featureFlagRouter,
      cacheService: cacheServiceMock,
    })

    try {
      const context_ = { ...context }
      const quantity = context_.quantity
      delete context_.quantity

      const val = await selectionStrategy.calculateVariantPrice(
        [{ variantId: variant_id, quantity }],
        context_
      )

      validate(val, { mockMoneyAmountRepository, featureFlagRouter })
    } catch (error) {
      if (typeof validateException === "function") {
        validateException(error, { mockMoneyAmountRepository })
      } else {
        throw error
      }
    }
  }

const toTest = [
  [
    "Variant with only default price",
    {
      variant_id: "test-basic-variant",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        let ffFields = {}
        if (featureFlagRouter.isFeatureEnabled("tax_inclusive_pricing")) {
          ffFields = {
            originalPriceIncludesTax: false,
            calculatedPriceIncludesTax: false,
          }
        }

        const variantId = "test-basic-variant"

        if (
          featureFlagRouter.isFeatureEnabled(TaxInclusivePricingFeatureFlag.key)
        ) {
          expect(
            mockMoneyAmountRepository.findManyForVariantsInRegion
          ).toHaveBeenCalledWith(
            [variantId],
            "test-region",
            "dkk",
            undefined,
            undefined,
            true
          )
        } else {
          expect(
            mockMoneyAmountRepository.findManyForVariantsInRegion
          ).toHaveBeenCalledWith(
            [variantId],
            "test-region",
            "dkk",
            undefined,
            undefined
          )
        }

        expect(value.get(variantId)).toEqual({
          ...ffFields,
          originalPrice: 100,
          calculatedPrice: 100,
          calculatedPriceType: "default",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
          ],
        })
      },
    },
  ],
  [
    "findManyForVariantsInRegion is invoked with the correct customer",
    {
      variant_id: "test-variant",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        customer_id: "test-customer-1",
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        if (
          featureFlagRouter.isFeatureEnabled(TaxInclusivePricingFeatureFlag.key)
        ) {
          expect(
            mockMoneyAmountRepository.findManyForVariantsInRegion
          ).toHaveBeenCalledWith(
            ["test-variant"],
            "test-region",
            "dkk",
            "test-customer-1",
            undefined,
            true
          )
        } else {
          expect(
            mockMoneyAmountRepository.findManyForVariantsInRegion
          ).toHaveBeenCalledWith(
            ["test-variant"],
            "test-region",
            "dkk",
            "test-customer-1",
            undefined
          )
        }
      },
    },
  ],
  [
    "Lowest valid price is returned",
    {
      variant_id: "test-variant",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        customer_id: "test-customer-1",
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        let ffFields = {}
        if (featureFlagRouter.isFeatureEnabled("tax_inclusive_pricing")) {
          ffFields = {
            originalPriceIncludesTax: false,
            calculatedPriceIncludesTax: false,
          }
        }
        expect(value.get("test-variant")).toEqual({
          ...ffFields,
          originalPrice: 100,
          calculatedPrice: 50,
          calculatedPriceType: "sale",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 50,
              region_id: "test-region",
              currency_code: "dkk",
              price_list: { type: "sale" },
              max_quantity: null,
              min_quantity: null,
            },
          ],
        })
      },
    },
  ],
  [
    "Prices with quantity limits are ignored with no provided quantity",
    {
      variant_id: "test-variant",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        customer_id: "test-customer-2",
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        let ffFields = {}
        if (featureFlagRouter.isFeatureEnabled("tax_inclusive_pricing")) {
          ffFields = {
            originalPriceIncludesTax: false,
            calculatedPriceIncludesTax: false,
          }
        }
        expect(value.get("test-variant")).toEqual({
          ...ffFields,
          originalPrice: 100,
          calculatedPrice: 100,
          calculatedPriceType: "default",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 30,
              min_quantity: 10,
              max_quantity: 12,
              region_id: "test-region",
              price_list: { type: "sale" },
              currency_code: "dkk",
            },
            {
              amount: 20,
              min_quantity: 3,
              max_quantity: 5,
              price_list: { type: "sale" },
              region_id: "test-region",
              currency_code: "dkk",
            },
            {
              amount: 50,
              min_quantity: 5,
              max_quantity: 10,
              price_list: { type: "sale" },
              region_id: "test-region",
              currency_code: "dkk",
            },
          ],
        })
      },
    },
  ],
  [
    "Prices With quantity limits are applied correctly when a quantity is provided",
    {
      variant_id: "test-variant",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        customer_id: "test-customer-2",
        quantity: 7,
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        let ffFields = {}
        if (featureFlagRouter.isFeatureEnabled("tax_inclusive_pricing")) {
          ffFields = {
            originalPriceIncludesTax: false,
            calculatedPriceIncludesTax: false,
          }
        }
        expect(value.get("test-variant")).toEqual({
          ...ffFields,
          originalPrice: 100,
          calculatedPrice: 50,
          calculatedPriceType: "sale",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 30,
              min_quantity: 10,
              max_quantity: 12,
              region_id: "test-region",
              price_list: { type: "sale" },
              currency_code: "dkk",
            },
            {
              amount: 20,
              min_quantity: 3,
              max_quantity: 5,
              price_list: { type: "sale" },
              region_id: "test-region",
              currency_code: "dkk",
            },
            {
              amount: 50,
              min_quantity: 5,
              max_quantity: 10,
              price_list: { type: "sale" },
              region_id: "test-region",
              currency_code: "dkk",
            },
          ],
        })
      },
    },
  ],
  [
    "Prices with quantity are in prices array with no quantity set",
    {
      variant_id: "test-variant",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        customer_id: "test-customer-2",
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        let ffFields = {}
        if (featureFlagRouter.isFeatureEnabled("tax_inclusive_pricing")) {
          ffFields = {
            originalPriceIncludesTax: false,
            calculatedPriceIncludesTax: false,
          }
        }
        expect(value.get("test-variant")).toEqual({
          ...ffFields,
          originalPrice: 100,
          calculatedPrice: 100,
          calculatedPriceType: "default",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 30,
              min_quantity: 10,
              max_quantity: 12,
              region_id: "test-region",
              price_list: { type: "sale" },
              currency_code: "dkk",
            },
            {
              amount: 20,
              min_quantity: 3,
              max_quantity: 5,
              region_id: "test-region",
              price_list: { type: "sale" },
              currency_code: "dkk",
            },
            {
              amount: 50,
              min_quantity: 5,
              max_quantity: 10,
              region_id: "test-region",
              price_list: { type: "sale" },
              currency_code: "dkk",
            },
          ],
        })
      },
    },
  ],
]

const taxInclusiveTesting = [
  [
    "Variant with tax inclusive prices",
    {
      variant_id: "test-basic-variant-tax-inclusive",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        const variantId = "test-basic-variant-tax-inclusive"

        expect(
          mockMoneyAmountRepository.findManyForVariantsInRegion
        ).toHaveBeenCalledWith(
          [variantId],
          "test-region",
          "dkk",
          undefined,
          undefined,
          true
        )

        expect(value.get(variantId)).toEqual({
          originalPrice: 100,
          calculatedPrice: 100,
          originalPriceIncludesTax: true,
          calculatedPriceIncludesTax: true,
          calculatedPriceType: "default",
          prices: [
            {
              amount: 100,
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
              region_id: "test-region",
            },
            {
              amount: 120,
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
          ],
        })
      },
    },
  ],
  [
    "Variant with mixed pricing tax inclusive prices currency",
    {
      variant_id: "test-basic-variant-tax-inclusive-currency",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        tax_rates: [{ rate: 25 }],
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        const variantId = "test-basic-variant-tax-inclusive-currency"

        expect(
          mockMoneyAmountRepository.findManyForVariantsInRegion
        ).toHaveBeenCalledWith(
          [variantId],
          "test-region",
          "dkk",
          undefined,
          undefined,
          true
        )

        expect(value.get(variantId)).toEqual({
          originalPrice: 100,
          calculatedPrice: 100,
          originalPriceIncludesTax: false,
          calculatedPriceIncludesTax: true,
          calculatedPriceType: "default",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 100,
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
          ],
        })
      },
    },
  ],
  [
    "Variant with mixed pricing tax inclusive prices region",
    {
      variant_id: "test-basic-variant-tax-inclusive-region",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        tax_rates: [{ rate: 25 }],
      },
      validate: (value, { mockMoneyAmountRepository, featureFlagRouter }) => {
        const variantId = "test-basic-variant-tax-inclusive-region"

        expect(
          mockMoneyAmountRepository.findManyForVariantsInRegion
        ).toHaveBeenCalledWith(
          [variantId],
          "test-region",
          "dkk",
          undefined,
          undefined,
          true
        )
        expect(value.get(variantId)).toEqual({
          originalPrice: 100,
          calculatedPrice: 100,
          originalPriceIncludesTax: true,
          calculatedPriceIncludesTax: true,
          calculatedPriceType: "default",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 100,
              currency_code: "dkk",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
          ],
        })
      },
    },
  ],
  [
    "Variant with mixed tax prices (favoring tax inclusive)",
    {
      variant_id: "test-basic-variant-mixed",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        tax_rates: [{ rate: 25 }],
      },
      validate: (value, { mockMoneyAmountRepository }) => {
        const variantId = "test-basic-variant-mixed"

        expect(
          mockMoneyAmountRepository.findManyForVariantsInRegion
        ).toHaveBeenCalledWith(
          [variantId],
          "test-region",
          "dkk",
          undefined,
          undefined,
          true
        )
        expect(value.get(variantId)).toEqual({
          originalPrice: 100,
          calculatedPrice: 110,
          originalPriceIncludesTax: false,
          calculatedPriceIncludesTax: true,
          calculatedPriceType: "sale",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 95,
              currency_code: "dkk",
              price_list_id: "pl_1",
              max_quantity: null,
              min_quantity: null,
              price_list: { type: "sale" },
            },
            {
              amount: 110,
              currency_code: "dkk",
              price_list_id: "pl_2",
              max_quantity: null,
              min_quantity: null,
              price_list: { type: "sale", includes_tax: true },
            },
            {
              amount: 150,
              currency_code: "dkk",
              price_list_id: "pl_3",
              max_quantity: null,
              min_quantity: null,
              price_list: { type: "sale" },
            },
          ],
        })
      },
    },
  ],
  [
    "Variant with mixed tax price (favoring tax exclusive)",
    {
      variant_id: "test-basic-variant-mixed",
      context: {
        region_id: "test-region",
        currency_code: "dkk",
        tax_rate: 0.05,
      },
      validate: (value, { mockMoneyAmountRepository }) => {
        const variantId = "test-basic-variant-mixed"

        expect(
          mockMoneyAmountRepository.findManyForVariantsInRegion
        ).toHaveBeenCalledWith(
          [variantId],
          "test-region",
          "dkk",
          undefined,
          undefined,
          true
        )

        expect(value.get(variantId)).toEqual({
          originalPrice: 100,
          calculatedPrice: 95,
          originalPriceIncludesTax: false,
          calculatedPriceIncludesTax: false,
          calculatedPriceType: "sale",
          prices: [
            {
              amount: 100,
              region_id: "test-region",
              max_quantity: null,
              min_quantity: null,
              price_list_id: null,
            },
            {
              amount: 95,
              currency_code: "dkk",
              price_list_id: "pl_1",
              max_quantity: null,
              min_quantity: null,
              price_list: { type: "sale" },
            },
            {
              amount: 110,
              currency_code: "dkk",
              price_list_id: "pl_2",
              max_quantity: null,
              min_quantity: null,
              price_list: { type: "sale", includes_tax: true },
            },
            {
              amount: 150,
              currency_code: "dkk",
              price_list_id: "pl_3",
              max_quantity: null,
              min_quantity: null,
              price_list: { type: "sale" },
            },
          ],
        })
      },
    },
  ],
]

describe("PriceSelectionStrategy", () => {
  describe("calculateVariantPrice", () => {
    ;[true, false].forEach((flagValue) => {
      describe(`with tax inclusive pricing ${flagValue}`, () => {
        test.each(toTest)(`%s`, executeTest(flagValue))
      })
    })
    /* describe("tax inclusive testing", () => {
      test.each(taxInclusiveTesting)(`%s`, executeTest(true))
    })*/
  })
})

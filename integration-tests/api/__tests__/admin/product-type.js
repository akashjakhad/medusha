const path = require("path")

const { IdMap } = require("medusa-test-utils")

const setupServer = require("../../../environment-helpers/setup-server")
const { useApi } = require("../../../environment-helpers/use-api")
const { initDb, useDb } = require("../../../environment-helpers/use-db")

const adminSeeder = require("../../../helpers/admin-seeder")
const productSeeder = require("../../../helpers/product-seeder")
const {
  DiscountRuleType,
  AllocationType,
  DiscountConditionType,
  DiscountConditionOperator,
} = require("@medusajs/medusa")
const { simpleDiscountFactory } = require("../../../factories")

jest.setTimeout(50000)

const adminReqConfig = {
  headers: {
    "x-medusa-access-token": "test_token",
  },
}

describe("/admin/product-types", () => {
  let medusaProcess
  let dbConnection

  beforeAll(async () => {
    const cwd = path.resolve(path.join(__dirname, "..", ".."))
    dbConnection = await initDb({ cwd })
    medusaProcess = await setupServer({ cwd })
  })

  afterAll(async () => {
    const db = useDb()
    await db.shutdown()

    medusaProcess.kill()
  })

  describe("GET /admin/product-types", () => {
    beforeEach(async () => {
      await productSeeder(dbConnection)
      await adminSeeder(dbConnection)
    })

    afterEach(async () => {
      const db = useDb()
      await db.teardown()
    })

    it("returns a list of product types", async () => {
      const api = useApi()

      const res = await api.get("/admin/product-types", adminReqConfig)

      expect(res.status).toEqual(200)

      const typeMatch = {
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }

      expect(res.data.product_types).toMatchSnapshot([typeMatch, typeMatch])
    })

    it("returns a list of product types matching free text search param", async () => {
      const api = useApi()

      const res = await api.get(
        "/admin/product-types?q=test-type-new",
        adminReqConfig
      )

      expect(res.status).toEqual(200)

      const typeMatch = {
        created_at: expect.any(String),
        updated_at: expect.any(String),
      }

      // The value of the type should match the search param
      expect(res.data.product_types.map((pt) => pt.value)).toEqual([
        "test-type-new",
      ])

      // Should only return one type as there is only one match to the search param
      expect(res.data.product_types).toMatchSnapshot([typeMatch])
    })

    it("returns a list of product type filtered by discount condition id", async () => {
      const api = useApi()

      const resTypes = await api.get("/admin/product-types", adminReqConfig)

      const type1 = resTypes.data.product_types[0]
      const type2 = resTypes.data.product_types[1]

      const buildDiscountData = (code, conditionId, types) => {
        return {
          code,
          rule: {
            type: DiscountRuleType.PERCENTAGE,
            value: 10,
            allocation: AllocationType.TOTAL,
            conditions: [
              {
                id: conditionId,
                type: DiscountConditionType.PRODUCT_TYPES,
                operator: DiscountConditionOperator.IN,
                product_types: types,
              },
            ],
          },
        }
      }

      const discountConditionId = IdMap.getId("discount-condition-type-1")
      await simpleDiscountFactory(
        dbConnection,
        buildDiscountData("code-1", discountConditionId, [type1.id])
      )

      const discountConditionId2 = IdMap.getId("discount-condition-type-2")
      await simpleDiscountFactory(
        dbConnection,
        buildDiscountData("code-2", discountConditionId2, [type2.id])
      )

      let res = await api.get(
        `/admin/product-types?discount_condition_id=${discountConditionId}`,
        adminReqConfig
      )

      expect(res.status).toEqual(200)
      expect(res.data.product_types).toHaveLength(1)
      expect(res.data.product_types).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: type1.id })])
      )

      res = await api.get(
        `/admin/product-types?discount_condition_id=${discountConditionId2}`,
        adminReqConfig
      )

      expect(res.status).toEqual(200)
      expect(res.data.product_types).toHaveLength(1)
      expect(res.data.product_types).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: type2.id })])
      )

      res = await api.get(`/admin/product-types`, adminReqConfig)

      expect(res.status).toEqual(200)
      expect(res.data.product_types).toHaveLength(2)
      expect(res.data.product_types).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: type1.id }),
          expect.objectContaining({ id: type2.id }),
        ])
      )
    })
  })
})

"use client";
import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Item } from "@/interface/cart";
import { useSession } from "next-auth/react";
import { CartContext } from "@/context/CartContext";

interface Order {
    _id: string;
    Items: Item[];
    totalOrderPrice: number;
    paymentMethodType: string;
    isPaid: boolean;
    isDelivered: boolean;
    createdAt: string;
    user: {
        name: string;
        email: string;
        phone: string;
    };
    shippingAddress: {
        city: string;
        details: string;
        phone: string;
    };
}

export default function AllOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const { cart } = useContext(CartContext);

    async function getUserOrders(userId: string) {
        const res = await fetch(
            `https://ecommerce.routemisr.com/api/v1/orders/user/${userId}`
        );
        if (res.ok) {
            const data = await res.json();
            setOrders(data);
        } else {
            throw new Error("Failed to fetch orders");
        }
    }

    useEffect(() => {
        if (cart) getUserOrders(cart?.cartId);
    }, []);

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">My Orders</h1>
            {orders.length === 0 ? (
                <p className="text-muted-foreground">No orders found.</p>
            ) : (
                orders?.map((order) => (
                    <Card key={order._id} className="shadow-md rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Order #{order._id.slice(-6)}</span>
                                <div className="flex gap-2">
                                    <Badge
                                        variant={
                                            order.isPaid
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {order.isPaid ? "Paid" : "Unpaid"}
                                    </Badge>
                                    <Badge
                                        variant={
                                            order.isDelivered
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {order.isDelivered
                                            ? "Delivered"
                                            : "Pending"}
                                    </Badge>
                                </div>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString()}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Cart Items */}
                            <div className="space-y-3">
                                {order?.Items?.map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex items-center gap-4 border p-3 rounded-lg"
                                    >
                                        <Image
                                            src={item.product.imageCover}
                                            alt={item.product.title}
                                            width={64}
                                            height={64}
                                            className="rounded-xl object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {item.product.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Qty: {item.count} × $
                                                {item.price}
                                            </p>
                                        </div>
                                        <p className="font-semibold">
                                            $
                                            {(item.count * item.price).toFixed(
                                                2
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <hr />

                            {/* Summary */}
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span>${order.totalOrderPrice}</span>
                            </div>

                            {/* User Info */}
                            <div className="text-sm text-muted-foreground">
                                <p>
                                    <strong>Customer:</strong> {order.user.name}{" "}
                                    ({order.user.email})
                                </p>
                                <p>
                                    <strong>Phone:</strong> {order.user.phone}
                                </p>
                                <p>
                                    <strong>Shipping:</strong>{" "}
                                    {order.shippingAddress.city},{" "}
                                    {order.shippingAddress.details} –{" "}
                                    {order.shippingAddress.phone}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}
